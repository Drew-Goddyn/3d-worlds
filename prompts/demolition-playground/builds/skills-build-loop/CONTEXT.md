
# Demolition Playground

An evacuated downtown district whose structures can be demolished, inspected through time, and restored.

## Language

**Structural member**:
A load-bearing part of a building, such as a column, beam, or floor slab.

**Joint**:
A connection through which structural members support or constrain one another.

**Debris**:
Material detached from a structure or destructible object, including large members, fragments, and architectural details.

**Chain collapse**:
A collapse caused by the physical consequences of an earlier collapse compromising another structure.

**Simulation time**:
Elapsed time within the city, distinct from the wall-clock time spent viewing or controlling it.
_Avoid_: Real time when referring to the rewind window.

**Recorded history**:
The past city states and events belonging to the current course of play.

**Playhead**:
The moment in recorded history currently being viewed.

**Rewind**:
Traversal of recorded history toward an earlier city state.
_Avoid_: Reset when referring only to movement through history.

**Branch**:
A replacement future created by changing the world from a historical moment.

**Pristine state**:
The original undamaged district, ready for demolition.

**Reset-city**:
A return to the pristine state through reverse traversal of the current run's recorded history.

**Reset-view**:
A return to the hero camera overview, independent of the city's condition.


- **Physical record:** An exact authoritative snapshot, including ordered actions at a simulation timestamp.
- **Presentation sample:** A read-only fractional view between physical records; discrete identities and events come from the earlier moment.
- **Spatial chunk:** A persistent physical body carrying nearby architectural pieces; its contact bounds come from those same pieces.
- **Tank wreckage:** The persistent moving shell after rupture, distinct from discharged water and roof-mounted support legs.
