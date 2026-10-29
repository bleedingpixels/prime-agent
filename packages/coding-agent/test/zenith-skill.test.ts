import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getBundledSkillsDir } from "../src/config.js";
import { loadSkillsFromDir, type PythonSkillRuntimeInfo } from "../src/core/skills.js";
import { IpythonKernelProvisioner } from "../src/core/tools/ipython.js";

const packagePath = join(getBundledSkillsDir(), "zenith");

function bundledZenithSkill(): PythonSkillRuntimeInfo {
	return {
		name: "zenith",
		importName: "zenith",
		packagePath,
		pyprojectPath: join(packagePath, "pyproject.toml"),
	};
}

describe("bundled Zenith skill", { tags: ["kernel-heavy"] }, () => {
	let provisioner: IpythonKernelProvisioner | undefined;

	afterEach(async () => {
		await provisioner?.dispose();
		provisioner = undefined;
	});

	it("loads as a built-in Python skill named zenith", () => {
		const { skills, diagnostics } = loadSkillsFromDir({ dir: getBundledSkillsDir(), source: "builtin" });

		expect(diagnostics).toEqual([]);
		const skill = skills.find((candidate) => candidate.name === "zenith");
		expect(skill).toBeDefined();
		expect(skill?.kind).toBe("python");
		expect(skill?.kind === "python" && skill.python.importName).toBe("zenith");
	});

	it("ships the complete non-empty Python package and operator references", () => {
		const requiredFiles = [
			"SKILL.md",
			"pyproject.toml",
			"src/zenith/__init__.py",
			"references/api.md",
			"references/mission-design.md",
		];

		for (const relativePath of requiredFiles) {
			const absolutePath = join(packagePath, relativePath);
			expect(existsSync(absolutePath), absolutePath).toBe(true);
			expect(statSync(absolutePath).size, absolutePath).toBeGreaterThan(0);
		}

		const skillMarkdown = readFileSync(join(packagePath, "SKILL.md"), "utf8");
		expect(skillMarkdown).toContain("name: zenith");
		expect(skillMarkdown).toContain(".prime/agent/zenith/missions");
	});

	it("pre-imports the async public API and wraps run as the module callable", async () => {
		provisioner = new IpythonKernelProvisioner(packagePath, {
			pythonSkills: [bundledZenithSkill()],
			hostHandlers: {},
		});

		const manager = await provisioner.ensure();
		const result = await manager.execute(`
import inspect
expected_async = ["start", "advance", "set_concurrency", "decide", "close", "abort", "end_task", "end_review", "run"]
expected_sync = ["submit_plan", "inspect", "list_missions"]
print(zenith.__name__)
print(callable(zenith))
print(all(inspect.iscoroutinefunction(getattr(zenith, name)) for name in expected_async))
print(all(callable(getattr(zenith, name)) and not inspect.iscoroutinefunction(getattr(zenith, name)) for name in expected_sync))
`);

		expect(result.status).toBe("ok");
		expect(result.stdout.trim().split("\n")).toEqual(["zenith", "True", "True", "True"]);
	});
	it("runs a mocked host lifecycle inside a live provisioned kernel", async () => {
		provisioner = new IpythonKernelProvisioner(packagePath, {
			pythonSkills: [bundledZenithSkill()],
			hostHandlers: {},
		});

		const manager = await provisioner.ensure();
		const result = await manager.execute(`
import json
import shutil
import tempfile

spawned = []
async def fake_spawn(prompt, *, name, model=None):
    handle = {"rlm_child_id": f"child-{len(spawned) + 1}", "name": name, "model": model, "status": "running"}
    spawned.append({"prompt": prompt, "handle": handle})
    return handle

async def fake_list():
    return []

async def fake_delete(target):
    return None

zenith_globals = zenith.advance.__globals__
zenith_globals["_rlm_spawn"] = fake_spawn
zenith_globals["_rlm_list_subagents"] = fake_list
zenith_globals["_rlm_delete_subagent"] = fake_delete
workspace = tempfile.mkdtemp(prefix="prime-zenith-kernel-")
try:
    started = await zenith.start("Kernel lifecycle", workspace=workspace, concurrency=1, require_preflight=False)
    contract = {"assertions": [{"id": "feature", "description": "Feature is delivered.", "required_evidence": ["focused-test"]}]}
    tasks = [
        {"id": "work", "role": "work", "targets": ["feature"], "depends_on": [], "description": "Implement feature."},
        {"id": "validator", "role": "validate", "targets": ["feature"], "depends_on": ["work"], "description": "Validate feature."},
        {"id": "gate", "role": "gate", "targets": ["feature"], "depends_on": ["validator"]},
    ]
    submitted = zenith.submit_plan(started["mission_id"], contract, tasks, workspace=workspace, mission="Bounded kernel charter")
    policy = await zenith.set_concurrency(started["mission_id"], "auto", workspace=workspace, min_concurrency=1, max_concurrency=4)
    advanced = await zenith.advance(started["mission_id"], workspace=workspace)
    inspected = zenith.inspect(started["mission_id"], workspace=workspace)
    print(json.dumps({
        "submitted_state": submitted["state"],
        "dispatched": [item["task_id"] for item in advanced["dispatched"]],
        "persisted_status": inspected["mission"]["tasks"]["work"]["status"],
        "policy_mode": policy["concurrency_policy"]["mode"],
        "effective": advanced["concurrency_policy"]["effective"],
        "spawn_count": len(spawned),
    }, sort_keys=True))
finally:
    shutil.rmtree(workspace)
`);

		expect(result.status).toBe("ok");
		expect(JSON.parse(result.stdout.trim())).toEqual({
			dispatched: ["work"],
			persisted_status: "running",
			policy_mode: "auto",
			effective: 1,
			spawn_count: 1,
			submitted_state: "running",
		});
	});
});
