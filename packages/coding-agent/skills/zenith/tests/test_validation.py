from __future__ import annotations

from copy import deepcopy

import pytest

import zenith


@pytest.fixture
def contract() -> dict:
    return {
        "assertions": [
            {
                "id": "feature",
                "description": "The feature works under the documented contract.",
                "required_evidence": ["focused-test"],
            },
        ]
    }


@pytest.fixture
def valid_tasks() -> list[dict]:
    return [
        {
            "id": "implement",
            "role": "work",
            "targets": ["feature"],
            "depends_on": [],
            "description": "Implement the feature and capture focused test evidence.",
        },
        {
            "id": "validate",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["implement"],
            "description": "Independently validate the feature and its evidence.",
        },
        {
            "id": "gate",
            "role": "gate",
            "targets": ["feature"],
            "depends_on": ["validate"],
        },
    ]


def test_valid_plan_normalises_schema(contract: dict, valid_tasks: list[dict]) -> None:
    clean_contract, clean_tasks = zenith._validate_plan(contract, valid_tasks)

    assert clean_contract["assertions"] == [
        {
            "id": "feature",
            "description": "The feature works under the documented contract.",
            "required_evidence": ["focused-test"],
        }
    ]
    assert [task["id"] for task in clean_tasks] == ["implement", "validate", "gate"]
    assert clean_tasks[0]["concurrency_cost"] == 1
    assert clean_tasks[0]["exclusive"] is False
    assert clean_tasks[0]["priority"] == 0
    assert clean_tasks[1]["read_only"] is True
    assert clean_tasks[1]["concurrency_cost"] == 1
    assert clean_tasks[2]["description"] == "AND gate for feature"
    assert "concurrency_cost" not in clean_tasks[2]


@pytest.mark.parametrize(
    "bad_contract, message",
    [
        (None, "contract must be a JSON object"),
        ({}, "contract.assertions must be a non-empty list"),
        ({"assertions": []}, "contract.assertions must be a non-empty list"),
        ({"assertions": [{"id": "feature", "description": "  ", "required_evidence": ["test"]}]}, "requires a non-empty description"),
        ({"assertions": [{"id": "feature", "description": "feature"}]}, "requires non-empty required_evidence"),
        ({"assertions": [{"id": "feature", "description": "feature", "required_evidence": []}]}, "requires non-empty required_evidence"),
        (
            {
                "assertions": [
                    {"id": "feature", "description": "one", "required_evidence": ["test"]},
                    {"id": "feature", "description": "two", "required_evidence": ["test"]},
                ]
            },
            "duplicate assertion id",
        ),
    ],
)
def test_rejects_empty_or_invalid_contract(
    bad_contract: object,
    message: str,
    valid_tasks: list[dict],
) -> None:
    with pytest.raises(zenith.ZenithError, match=message):
        zenith._validate_plan(bad_contract, valid_tasks)


def test_rejects_missing_dependency(contract: dict, valid_tasks: list[dict]) -> None:
    tasks = deepcopy(valid_tasks)
    tasks[1]["depends_on"] = ["missing"]

    with pytest.raises(zenith.ZenithError, match="unknown dependencies.*missing"):
        zenith._validate_plan(contract, tasks)


def test_rejects_dependency_cycles(contract: dict, valid_tasks: list[dict]) -> None:
    tasks = deepcopy(valid_tasks)
    tasks[0]["depends_on"] = ["gate"]

    with pytest.raises(zenith.ZenithError, match="dependency graph contains a cycle"):
        zenith._validate_plan(contract, tasks)


@pytest.mark.parametrize("owner_count", [0, 2])
def test_requires_exactly_one_work_owner(
    owner_count: int,
    contract: dict,
    valid_tasks: list[dict],
) -> None:
    tasks = deepcopy(valid_tasks)
    if owner_count == 0:
        tasks[0]["targets"] = ["unrelated"]
        contract = {
            "assertions": [
                {"id": "feature", "description": "feature", "required_evidence": ["test"]},
                {"id": "unrelated", "description": "unrelated", "required_evidence": ["test"]},
            ]
        }
        tasks.extend(
            [
                {
                    "id": "validate-unrelated",
                    "role": "validate",
                    "targets": ["unrelated"],
                    "depends_on": ["implement"],
                    "description": "validate unrelated",
                },
                {
                    "id": "gate-unrelated",
                    "role": "gate",
                    "targets": ["unrelated"],
                    "depends_on": ["validate-unrelated"],
                },
            ]
        )
    else:
        tasks.insert(
            1,
            {
                "id": "duplicate-owner",
                "role": "work",
                "targets": ["feature"],
                "depends_on": [],
                "description": "A forbidden second owner.",
            },
        )

    with pytest.raises(zenith.ZenithError, match="requires exactly one work owner"):
        zenith._validate_plan(contract, tasks)


@pytest.mark.parametrize(
    "mutation, message",
    [
        ("no-validator", "has no validator coverage"),
        ("validator-not-downstream", "is not downstream of work owner"),
        ("no-gate", "has no gate coverage"),
        ("gate-not-downstream", "is not downstream of validators"),
    ],
)
def test_requires_validator_and_and_gate_coverage_with_dependencies(
    mutation: str,
    message: str,
    contract: dict,
    valid_tasks: list[dict],
) -> None:
    tasks = deepcopy(valid_tasks)
    if mutation == "no-validator":
        tasks = [task for task in tasks if task["id"] != "validate"]
        tasks[-1]["depends_on"] = ["implement"]
    elif mutation == "validator-not-downstream":
        tasks[1]["depends_on"] = []
    elif mutation == "no-gate":
        tasks = [task for task in tasks if task["id"] != "gate"]
    else:
        tasks[2]["depends_on"] = ["implement"]

    with pytest.raises(zenith.ZenithError, match=message):
        zenith._validate_plan(contract, tasks)


def test_and_gate_depends_on_every_validator_for_its_assertion(contract: dict, valid_tasks: list[dict]) -> None:
    tasks = deepcopy(valid_tasks)
    tasks.insert(
        2,
        {
            "id": "validate-second",
            "role": "validate",
            "targets": ["feature"],
            "depends_on": ["implement"],
            "description": "A second independent validator.",
        },
    )

    with pytest.raises(zenith.ZenithError, match="gate gate is not downstream of validators.*validate-second"):
        zenith._validate_plan(contract, tasks)


def test_targetless_work_is_supported_but_validators_and_gates_require_targets(contract: dict, valid_tasks: list[dict]) -> None:
    tasks = deepcopy(valid_tasks)
    tasks.insert(
        0,
        {
            "id": "prepare",
            "role": "work",
            "targets": [],
            "depends_on": [],
            "description": "Prepare targetless shared scaffolding.",
        },
    )
    tasks[1]["depends_on"] = ["prepare"]

    _, clean = zenith._validate_plan(contract, tasks)
    assert clean[0]["targets"] == []

    validator = deepcopy(valid_tasks)
    validator[1]["targets"] = []
    with pytest.raises(zenith.ZenithError, match="task validate.targets must not be empty"):
        zenith._validate_plan(contract, validator)

    gate = deepcopy(valid_tasks)
    gate[2]["targets"] = []
    with pytest.raises(zenith.ZenithError, match="task gate.targets must not be empty"):
        zenith._validate_plan(contract, gate)


@pytest.mark.parametrize(
    "field,value,message",
    [
        ("concurrency_cost", 0, "concurrency_cost must be an integer from 1 through 32"),
        ("concurrency_cost", True, "concurrency_cost must be an integer from 1 through 32"),
        ("exclusive", 1, "exclusive must be a boolean"),
        ("priority", True, "priority must be an integer from -100 through 100"),
        ("priority", 101, "priority must be an integer from -100 through 100"),
    ],
)
def test_scheduler_hint_validation(
    contract: dict, valid_tasks: list[dict], field: str, value: object, message: str
) -> None:
    tasks = deepcopy(valid_tasks)
    tasks[0][field] = value
    with pytest.raises(zenith.ZenithError, match=message):
        zenith._validate_plan(contract, tasks)


def test_gate_rejects_scheduler_hints(contract: dict, valid_tasks: list[dict]) -> None:
    tasks = deepcopy(valid_tasks)
    tasks[2]["priority"] = 1
    with pytest.raises(zenith.ZenithError, match="scheduling fields"):
        zenith._validate_plan(contract, tasks)
