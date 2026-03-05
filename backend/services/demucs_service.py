from pathlib import Path
from typing import List


def split_into_stems(input_path: Path, output_dir: Path) -> List[str]:
    """
    Placeholder integration point for the Demucs model.

    The final implementation should:
    - Load the Demucs model (optionally configurable)
    - Run source separation on the given input audio file
    - Save stems (e.g., vocals, drums, bass, other) to output_dir
    - Return a list of generated stem filenames
    """
    # TODO: Implement Demucs inference call here
    # For now, we just ensure the output directory exists and
    # return a static list of expected stem names.
    output_dir.mkdir(parents=True, exist_ok=True)

    stems = ["vocals.wav", "drums.wav", "bass.wav", "other.wav"]

    # In the real implementation, each of these files would be written
    # to output_dir by the Demucs model.

    return stems

