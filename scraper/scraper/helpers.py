import os
import pathlib
import unicodedata


def normalize_string(s: str) -> str:
    normalized_str = (
        unicodedata.normalize("NFKD", s)
        .encode("ascii", "ignore")
        .decode("ascii", "ignore")
    )
    return normalize_whitespace(normalized_str)


def normalize_whitespace(s: str) -> str:
    return " ".join(s.split())


def remove_whitespace(s: str) -> str:
    return s.replace(" ", "")


class LocalFilesystem:
    def __init__(self, path) -> None:
        self.path = pathlib.Path(path)

    def put(self, filename: str, data: str) -> str:
        file_path = self.path / filename
        file_path.parents[0].mkdir(parents=True, exist_ok=True)
        with file_path.open("w") as f:
            f.write(data)

    def get(self, filename: str, default: str = "") -> str:
        filepath = self.path / filename
        if not filepath.is_file():
            return default
        with filepath.open() as f:
            return f.read()

    def listdir(self, directory: str = "") -> list[str]:
        results = (self.path / directory.strip()).rglob("*")
        return [
            result.as_posix().removeprefix(self.path.as_posix()).strip("/")
            for result in results
            if result.is_file()
        ]
