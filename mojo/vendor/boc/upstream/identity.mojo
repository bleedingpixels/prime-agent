# Branded cown-handle identity for the BoC executable model.
#
# A handle names one cown by (runtime identity, runtime generation, slot,
# slot generation). The brand field separates constructed handles from raw
# integers so an unbranded bit pattern is rejected by `is_valid` instead of
# aliasing a real cown. Within one runtime generation the total order is
# (slot_id, slot_generation) exactly as the specification's sorted-link rule
# requires; runtime identity and runtime generation break ties so the order
# is total over all representable handles (a model never mixes validated
# handles across runtimes or generations, so the in-runtime order is what
# scheduling observes).


struct CownHandle(ImplicitlyCopyable, Movable):
    """Branded identity of one cown in one runtime generation."""

    var brand: Int
    var runtime_id: Int
    var runtime_generation: Int
    var slot_id: Int
    var slot_generation: Int

    comptime BRAND = 0x434F574E  # "COWN"

    def __init__(
        out self,
        runtime_id: Int,
        runtime_generation: Int,
        slot_id: Int,
        slot_generation: Int,
    ):
        self.brand = Self.BRAND
        self.runtime_id = runtime_id
        self.runtime_generation = runtime_generation
        self.slot_id = slot_id
        self.slot_generation = slot_generation

    def __eq__(self, other: CownHandle) -> Bool:
        return (
            self.runtime_id == other.runtime_id
            and self.runtime_generation == other.runtime_generation
            and self.slot_id == other.slot_id
            and self.slot_generation == other.slot_generation
        )

    def __ne__(self, other: CownHandle) -> Bool:
        return not self.__eq__(other)

    def __lt__(self, other: CownHandle) -> Bool:
        if self.slot_id != other.slot_id:
            return self.slot_id < other.slot_id
        if self.slot_generation != other.slot_generation:
            return self.slot_generation < other.slot_generation
        if self.runtime_id != other.runtime_id:
            return self.runtime_id < other.runtime_id
        return self.runtime_generation < other.runtime_generation

    def __gt__(self, other: CownHandle) -> Bool:
        return other.__lt__(self)

    def is_valid(self) -> Bool:
        """True iff the brand and shape fields name a well-formed handle."""
        return (
            self.brand == Self.BRAND
            and self.runtime_id >= 0
            and self.runtime_generation >= 1
            and self.slot_id >= 0
            and self.slot_generation >= 1
        )

    def describe(self) -> String:
        """Stable text form (diagnostics and replay refs), no raw addresses."""
        return String(self.slot_id) + ":" + String(self.slot_generation)
