"""Check the original tank shell samples independently of application contact code.

Run reviewer-replay.mjs first. Requires numpy and scipy. Paths are relative to this
script so the check also works when extracted from the independent review ZIP.
"""
from pathlib import Path
import json
import numpy as np
from scipy.spatial.transform import Rotation

root = Path(__file__).resolve().parent
states = json.loads((root / 'reviewer-replayed-tank-states.json').read_text())
angles = 0.7 + 1.5 * np.pi * np.arange(97) / 96
heights = -1.55 + 3.1 * np.arange(65) / 64
local = np.array([[1.9 * np.sin(a), y, 1.9 * np.cos(a)] for a in angles for y in heights])
results = []
for state in states:
    tank = np.array(state['tank'])
    rotation = Rotation.from_euler('XYZ', tank[6:9]).as_matrix()
    points = local @ rotation.T + tank[:3]
    hits = []
    for floor in state['floors']:
        inverse_rotation = Rotation.from_euler('XYZ', floor['rotation']).as_matrix()
        local_points = (points - np.array(floor['position'])) @ inverse_rotation
        half = np.array([(floor['bay'] - 0.06) / 2, 0.19, (floor['bay'] - 0.06) / 2]) - 0.001
        count = int(np.count_nonzero(np.all(np.abs(local_points) < half, axis=1)))
        if count:
            hits.append({'floor': floor['id'], 'intersections': count})
    results.append({'sequence': state['name'], 'fixed_steps': state['steps'],
                    'shell_samples': len(points),
                    'endpoint_intersections': sum(hit['intersections'] for hit in hits),
                    'intersecting_floors': hits, 'tank_mode': float(tank[12]),
                    'max_difference_from_captured_tank': state.get('maxCapturedTankDifference')})
assert results[0]['endpoint_intersections'] == 268
assert results[1]['endpoint_intersections'] == 0
assert results[2]['endpoint_intersections'] == 0
print(json.dumps(results, indent=2))
