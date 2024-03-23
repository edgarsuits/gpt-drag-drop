# Flask
from flask import flash
from flask import redirect
from flask import request
from flask import url_for
from werkzeug.utils import secure_filename
from io import StringIO
import pandas as pd
# User-Defined Modules
import database

ALLOWED_EXTENSIONS = {"csv", "tsv", "txt"}


def get_extension(filename):

    if "." in filename:
        ext = filename.rsplit('.', 1)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            return ext
    return None


def file_upload(file, input_fields):
    response = {"success": False, "error": ""}
    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)

    if file:
        filename = secure_filename(file.filename)
        ext = get_extension(filename)
        if not ext:
            response["error"] = f"The provided file does not have an accepted file extension. " \
                                f"Must be one of {ALLOWED_EXTENSIONS}"
        else:
            file = StringIO((file.stream.read()).decode("utf-8"))
            file.seek(0)
            problems = pd.read_csv(file, dtype=str)
            if not all([field in problems.columns for field in input_fields]):
                response["error"] = "Columns in data table do not match IDs of input fields in interface."
            else:
                response["problems"] = problems.to_dict(orient="records")
                response["success"] = True
    else:
        response["error"] = "File object is empty."

    return response


def validate_params(data, token):
    params = {"validated": True}
    # Check message
    params["message"] = data.get("message")
    # Check reward
    params["reward"] = data.get("reward")
    # Check state
    params["state"] = data.get("state")
    # Check sai
    params["sai"] = data.get("sai")
    # Check train
    params["train"] = data.get("train") if data.get("train") is not None else True
    # Check demo only
    params["demo_only"] = data.get("demo_only") if data.get("demo_only") is not None else False
    # Check demo feedback only
    params["demo_feedback_only"] = data.get("demo_only") if data.get("demo_only") is not None else False
    # Check problem type
    params["problem_type"] = data.get("problem_type")
    # Check for new problem
    params["new_problem"] = data.get("new_problem")
    params["log_items"] = data.get("log_items")

    # Get token data
    params["user_id"] = token.get("id")
    params["tutor_id"] = data.get("tutor_id")
    # Check agent ID

    return params

