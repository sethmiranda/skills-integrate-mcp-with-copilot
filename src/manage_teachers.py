"""Create local teacher credentials for the activities API."""

import argparse
import getpass
import json
import os
import tempfile

from app import TEACHERS_FILE, hash_password, load_teacher_credentials


def add_teacher(username: str) -> None:
    username = username.strip()
    if not username:
        raise SystemExit("Username cannot be empty")

    password = getpass.getpass("Password (at least 12 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters")
    if password != confirmation:
        raise SystemExit("Passwords do not match")

    teachers = load_teacher_credentials()
    if any(teacher.get("username") == username for teacher in teachers):
        raise SystemExit(f"Teacher {username!r} already exists")
    teachers.append({"username": username, "password_hash": hash_password(password)})

    TEACHERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=TEACHERS_FILE.parent, delete=False
        ) as temp_file:
            temp_path = temp_file.name
            json.dump({"teachers": teachers}, temp_file, indent=2)
            temp_file.write("\n")
        os.chmod(temp_path, 0o600)
        os.replace(temp_path, TEACHERS_FILE)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

    print(f"Added teacher {username!r} to {TEACHERS_FILE}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    add_parser = subparsers.add_parser("add", help="Add a teacher login")
    add_parser.add_argument("username")
    args = parser.parse_args()

    if args.command == "add":
        add_teacher(args.username)


if __name__ == "__main__":
    main()