"""Build the browser sample from the original freiburg1_xyz .tgz (requires Pillow)."""
import argparse
from bisect import bisect_left
from decimal import Decimal
import io
import json
from pathlib import Path
import tarfile

from PIL import Image


SEQUENCE = "freiburg1_xyz"
PREFIX = "rgbd_dataset_" + SEQUENCE + "/"


def read_rows(archive, name):
    with archive.extractfile(PREFIX + name) as file:
        rows = (line.decode().strip() for line in file)
        return [line.split() for line in rows if line and not line.startswith("#")]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data")
    args = parser.parse_args()
    frame_dir = args.output / "frames"
    frame_dir.mkdir(parents=True, exist_ok=True)
    with tarfile.open(args.archive, "r:gz") as archive:
        rgb = read_rows(archive, "rgb.txt")
        poses = read_rows(archive, "groundtruth.txt")
        pose_times = [Decimal(row[0]) for row in poses]
        valid = []
        for stamp, image in rgb:
            rgb_time = Decimal(stamp)
            i = bisect_left(pose_times, rgb_time)
            nearest = min(range(max(0, i - 1), min(len(poses), i + 1)),
                          key=lambda j: abs(pose_times[j] - rgb_time))
            if abs(pose_times[nearest] - rgb_time) <= Decimal("0.020"):
                valid.append((rgb_time, image, poses[nearest]))
        if len(valid) < 64:
            raise ValueError("Too few RGB frames with matched ground truth")
        chosen = [valid[round(i * (len(valid) - 1) / 63)] for i in range(64)]
        selected_paths = {PREFIX + row[1]: i for i, row in enumerate(chosen)}
    # Sequentially decode the compressed archive once for all selected images.
    seen = set()
    with tarfile.open(args.archive, "r|gz") as archive:
        for item in archive:
            if item.name not in selected_paths:
                continue
            i = selected_paths[item.name]
            with Image.open(io.BytesIO(archive.extractfile(item).read())) as image:
                image.convert("RGB").resize((320, 240), Image.Resampling.LANCZOS).save(
                    frame_dir / f"{i:03}.jpg", quality=78, optimize=True)
            seen.add(i)
    if len(seen) != len(chosen):
        raise ValueError("Missing selected RGB images in archive")
    frames = []
    for i, (rgb_time, _, pose) in enumerate(chosen):
        frames.append({
            "t": float(rgb_time - chosen[0][0]),
            "rgbTimestamp": float(rgb_time), "poseTimestamp": float(pose[0]),
            "p": list(map(float, pose[1:4])), "q": list(map(float, pose[4:8])),
            "image": f"data/frames/{i:03}.jpg",
        })
    output = {"sequence": SEQUENCE, "frames": frames}
    (args.output / "sequence.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
