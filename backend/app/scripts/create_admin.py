
import asyncio
import getpass
import os
import sys

from dotenv import load_dotenv
# pyrefly: ignore[missing-import]
from pymongo.errors import DuplicateKeyError

# Load the backend .env file before importing security settings.
load_dotenv()

from app.core.security import hash_password
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database


async def main():
    email = input("Enter admin email: ").strip().lower()

    if not email or "@" not in email:
        print("Please enter a valid email address.")
        return

    password = getpass.getpass("Enter admin password (minimum 12 characters): ")

    if len(password) < 12:
        print("Password must contain at least 12 characters.")
        return

    confirm_password = getpass.getpass("Confirm admin password: ")

    if password != confirm_password:
        print("Passwords do not match.")
        return

    await connect_to_mongo()

    try:
        database = get_database()
        users = database["users"]

        existing_admin = await users.find_one({"email": email})

        if existing_admin:
            print("An account with this email already exists. No changes made.")
            return

        admin = {
            "email": email,
            "hashed_password": hash_password(password),
            "role": "admin",
        }

        try:
            result = await users.insert_one(admin)
            print(f"Admin account created successfully. ID: {result.inserted_id}")
        except DuplicateKeyError:
            print("An account with this email already exists.")

    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(f"Admin creation failed: {exc}", file=sys.stderr)
        sys.exit(1)
