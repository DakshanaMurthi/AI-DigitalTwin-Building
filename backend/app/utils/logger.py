import logging
import sys
from pathlib import Path

# Construct the absolute path to the logs directory
# This file is located at backend/app/utils/logger.py
# We want to target backend/app/logs/
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_FILE = LOG_DIR / "application.log"

# Ensure the logs directory exists automatically
LOG_DIR.mkdir(parents=True, exist_ok=True)

def _setup_logger():
    """
    Configures and returns a production-ready logger instance.
    Outputs to both the console and a local log file.
    """
    logger = logging.getLogger("digital_twin_logger")
    logger.setLevel(logging.INFO)

    # Prevent adding handlers multiple times if imported in multiple modules
    if logger.hasHandlers():
        return logger

    # Log format: Timestamp - Log Level - Module Name - Message
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | [%(module)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # 1. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # 2. File Handler
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # Attach handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

# Expose a single reusable logger object
logger = _setup_logger()
