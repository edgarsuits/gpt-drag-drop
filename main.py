# Flask
import flash
import flask
from flask import Flask
from flask import flash
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import request
from flask import send_from_directory
from flask import session
from flask import url_for
# Other Python Modules
from collections import defaultdict
from datetime import datetime
from datetime import timedelta
from json import loads
import jwt
import os
import re
from sqlite3 import Error
import sqlite3
import sys
# User-Defined Modules
from app_setup import *
import database
import helpers
import logger

import tutor
import openai

sys.setrecursionlimit(10000)
openai.api_key = os.getenv('OPENAI_API_KEY', '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')

########
# AUTH #
########

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/")
def index():
        return render_template("tutor_builder.html")


#################
# TUTOR BUILDER #
#################



###########
# GENERAL #
###########

@app.route("/log", methods=["POST"])
def log():
    resp = check_token()
    if resp.get("error"):
        if "redirect" in resp:
            return redirect(url_for(resp["redirect"]))
        else:
            return jsonify(resp["error"]), resp["error_code"]
    token = resp["token"]

    if request.method == "POST":
        params = helpers.validate_params(data=request.get_json(), token=token)
        logger.log(params["user_id"], params["log_items"])
        return flask.jsonify({})



    

@app.route("/edit", methods=["GET", 'POST'])
def edit():
    return render_template("edit.html")


@app.route("/preview", methods=["GET", 'POST'])
def preview():
    return render_template("preview.html")




@app.route("/tutor_builder", methods=["GET", 'POST'])
def tutor_builder():
    conn = get_db_connection()

    tutors = conn.execute('SELECT * FROM tutors').fetchall()

    conn.close()
    return render_template("tutor_builder.html", tutors=tutors)




@app.route("/profile", methods=["GET", 'POST'])
def profile():

    conn = get_db_connection()
    tutors = conn.execute('SELECT * FROM tutors').fetchall()

    # print("tutors_result=====", tutors)
    conn.close()

    token = session.get('token')
    if not token:
            return redirect(url_for('index'))
            # return jsonify({'Alert!': 'Token is missing!'}), 401
    try:
        # data = token
        data = jwt.decode(token, config['SECRET_KEY'], algorithms='HS256')
    except Exception as e:
        return jsonify(e), 401
    
    # # print("************* : ", data.first_name)
    return render_template("profile.html", user = data, tutors = {})


@app.route("/my_tutors", methods=["GET", 'POST'])
def my_tutors():

    conn = get_db_connection()
    tutors = conn.execute(f"SELECT id, name FROM tutors ").fetchall()
    conn.close()

    return render_template("my_tutors.html", tutors=tutors)


#Update_tutor_content
@app.route("/update_tutor_content", methods=['POST'])
def update_tutor_content():

    request_data = request.get_json()

    content = request_data['content']

    tutorName = request_data['tutorName']

    conn = get_db_connection()

    conn.execute(
        'UPDATE tutors SET content=? WHERE tutor_name=?', (content, tutorName))

    conn.commit()

    toReturn = {"return": "True"}

    conn.close()

    return jsonify(toReturn)

@app.route('/generateComponentLayout', methods=['POST'])
def generate_component_layout():
    data = request.get_json()
    text_specification = data.get('text')
    detailed_description = data.get('text')
    # Introduction to the task
    prompt_introduction = """Generate a compact representation layout string for a tutor interface component based on a specific format. This format includes elements such as rows, columns, labels, and inputs."""
# Explanation of the format
    prompt_format = "The format uses: row{{...}}, column{{...}} with each element stacked vertically over the other within the column, label[Label], and input[Placeholder]. Elements within rows and columns are enclosed in curly braces {{}}, and attributes are in square brackets []."
# Design instructions for the layout
    prompt_design_instructions = """Design principles require that each input element be separate, for example, in an equation, there should be one input element per digit. A single equation must be on a single row. Elements within a row are arranged horizontally. Rows cannot be directly nested within other rows, nor can columns be nested within other columns. Ensure each input element is separate, such as digits in an equation, and a single equation appears on a single line. There are no interactive buttons like 'Click to solve' within the component."""
    # Instruction to transform the description into the layout string
    prompt_task = """Transform the detailed description into the compact representation layout string according to the instructions."""
    prompt_examples = "Example 0: A fraction is always of the form column{input[Numerator], label[____], input[Denominator]} and is never row{input[Numerator], label[/], input[Denominator]}"
    prompt_examples += "Example 1: Equation row with two fraction members should be represented as a row with multiple columns inside for the members. Each column contains stacked numerator, operand (division symbol), and denominator. Include labels for operators in the main row. For a fraction equation like 1/2 + 3/4, the layout should be row{column{input[Numerator], label[____], input[Denominator]}, label[+], column{input[Numerator], label[____], input[Denominator]}, label[=], input[Result]}. This format ensures that each part of the fraction equation is clearly defined and separated for input. \
    "
    # Examples of the prompt format
    prompt_examples += ", Example 2: An equations solver should be represented as column{label[Equation], row{input[Equation Coefficient 1], label[x], label[+], input[Equation Coefficient 2], label[=], input[Equation Result]}}."
    prompt_examples += ", Example 3: For a radicals tutor compoenent, the representation would be column{label[Solve the following radicals multiplication problem below], row{label[What is √2 * √2], input[Result]}, input{label[Simplify the expression]}}"
    prompt_examples += ", Example 4: For a Squared Tutor component, the representation would be column{label[Enter the number you wish to square], row{input[Number], label[=], input[Result]}}. This configuration places the label and input for the number and the result all in a single horizontal row, maintaining a clear and concise layout."

    # Combining all the parts to form the complete prompt
    prompt = f"\n{prompt_introduction}\n\n{prompt_format}\n\n{prompt_design_instructions}\n\n{prompt_examples}\n\n{prompt_task}"
    instruction = f"\nDetailed Description:\n{detailed_description}\n"
    # Format the prompt with the detailed description from the request
    #prompt = f"""Given a detailed description of a tutor interface, generate a compact representation layout string in a specific format. The format includes titles, rows, columns, labels, and inputs, represented as follows: title[Title], row {{ ... }}, column {{ ... }}, label[Label], and input[Placeholder]. Elements inside rows and columns should be enclosed in curly braces {{}}, and element attributes should be enclosed in square brackets []. Ensure the output is precise and adheres to this structure for easy parsing.
    #Design instructions: Given that the intelligent tutor will utilize an AI algorithm to learn from the teacher interaction what the problem solution is; each input element should be separate, for example in an equation there should be one input element per digit. Respect design principles; for example, a single equation must be in a single line. 
    #Detailed Description:
    #{detailed_description}
    #Transform this description into the compact representation layout string according to the instructions. Respond in one line."""

    try:
        response = openai.chat.completions.create(
          model="gpt-4", # Adjusted to use GPT-4
        messages=[{"role": "system", "content": prompt}, {"role": "user", "content": instruction }]
        )
        generated_text = response.choices[0].message.content.strip()
        print(generated_text)
        # Return the compact layout generated by OpenAI
        return jsonify({"compactLayout": generated_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/generateTutorLayout', methods=['POST'])
def generate_tutor_layout():
    data = request.get_json()
    text_specification = data.get('text')
    detailed_description = data.get('text')
    # Introduction to the task
    prompt_system = "Create a dynamic and interactive tutor interface layout specifically crafted for problem-solving exercises, which commences with the precise definition of variables that are essential for the problem at hand. Each interface is to facilitate a clear, step-by-step resolution pathway, commencing with an explicit problem statement and progressing through a structured series of steps. Each step is to include text inputs that are directly linked to data sources, ensuring their correctness can be validated through an HTN (Hierarchical Task Network) process. This setup should lead to the revealing of the final solution, all while adhering to pedagogical best practices that logically sequence problem-solving elements and enforce the understanding of the educational content."

    prompt_introduction = """Generate a compact representation layout string for a tutor interface based on a specific format. This format includes elements such as titles, rows, columns, labels, and inputs."""
# Explanation of the format
    prompt_format = "The format uses: title[Title], row{{...}}, column{{...}} with each element stacked vertically over the other within the column, label[Label], and input[Placeholder]. Elements within rows and columns are enclosed in curly braces {{}}, and attributes are in square brackets []."
# Design instructions for the layout
    prompt_design_instructions = """Design principles require that each input element be separate, for example, in an equation, there should be one input element per digit. A single equation must be on a single row. Elements within a row are arranged horizontally. Rows cannot be directly nested within other rows, nor can columns be nested within other columns. Ensure each input element is separate, such as digits in an equation, and a single equation appears on a single line. There are no interactive buttons like 'Click to solve' within the layout."""
    # Instruction to transform the description into the layout string
    prompt_task = """Transform the detailed description into the compact representation layout string according to the instructions."""
    prompt_examples = "Example 0: A fraction is always of the form column{input[Numerator], label[____], input[Denominator]} and is never row{input[Numerator], label[/], input[Denominator]}"
    prompt_examples += "Example 1: Equation row with two fraction members should be represented as a row with multiple columns inside for the members. Each column contains stacked numerator, operand (division symbol), and denominator. Include labels for operators in the main row. For a fraction equation like 1/2 + 3/4, the layout should be row{column{input[Numerator], label[____], input[Denominator]}, label[+], column{input[Numerator], label[____], input[Denominator]}, label[=], input[Result]}. This format ensures that each part of the fraction equation is clearly defined and separated for input. \
    "
    # Examples of the prompt format
    prompt_examples += ", Example 2: A two equations solver should be represented as title[2 Equation Solver], column{label[First Equation], row{input[First Equation Coefficient 1], label[x], label[+], input[First Equation Coefficient 2], label[=], input[First Equation Result]}, label[Second Equation], row{input[Second Equation Coefficient 1], label[x], label[+], input[Second Equation Coefficient 2], label[y], label[=], input[Second Equation Result]}}."
    prompt_examples += ", Example 3: For a radicals tutor interface, the representation would be title[Radicals Tutor], column{label[Solve the following radicals multiplication problem below], row{label[What is √2 * √2], input[Result]}, input{label[Simplify the expression]}}"
    prompt_examples += ", Example 4: For a Squared Tutor interface, the representation would be title[Squared Tutor], column{label[Enter the number you wish to square], row{input[Number], label[=], input[Result]}}. This configuration places the label and input for the number and the result all in a single horizontal row, maintaining a clear and concise layout."
    prompt_examples += ", Example 5: For a Tutor for missionaries and cannibals, the representation would be title[Missionaries and Cannibals Tutor], column{label[Instructions], row{label[Enter the number of missionaries], input[Missionaries]}, row{label[Enter the number of cannibals], input[Cannibals]}, label[Solution], row{input[First Move], label[->], input[Second Move]}, row{input[Third Move], label[->], input[Fourth Move]}}. As in This case, make sure to scaffold all the resolution steps."
    prompt_examples += ", Example 6: For a tutor for calculating proper drug dosage levels for a nurse to administer to a patient, the representation would be title[Drug Dosage Tutor], column{label[Calculation Instructions], row{label[Enter the weight of the patient (in kg)], input[Patient Weight]}, row{label[Enter the recommended dosage per kg (in mg)], input[Dosage per kg]}, label[Calculated Dosage], row{input[Dosage Total], label[mg]}}"
    prompt_examples += ", Example 7: For A tutor for optimizing a business workflow, the representation would be title[Business Workflow Optimization Tutor], column{label[Instructions], row{label[Enter the number of employees], input[Number of Employees]}, row{label[Enter the number of hours worked by each employee per week], input[Hours Worked]}, row{label[Enter the average number of tasks completed by an employee per hour], input[Average Tasks Completed]}, label[Optimization Solution], row{input[Current Workflow Efficiency], label[%]}, row{label[Enter the changes you wish to make], input[Suggested Changes]}, label[Calculated Optimized Efficiency], row{input[Optimized Workflow Efficiency], label[%]}}"
    prompt_examples += ", Example 8: For an English article selection tutor, the representation would be title[English Article Selection Tutor], column{label[Instructions], label[Select the most appropriate article ('a', 'an', 'the' or 'no article') for each blank in the sentences below], row{label[Sentence 1], input[Sentence 1 Article Choice]}, row{label[Sentence 2], input[Sentence 2 Article Choice]}, row{label[Sentence 3], input[Sentence 3 Article Choice]}}"
    prompt_examples += ", Example 9: For a tutor for conducting a cash flow analysis of a business, the representation would be title[Cash Flow Analysis Tutor], column{label[Instructions], label[Enter the relevant business data in the fields below to begin your cash flow analysis conversion], row{label[Enter the total revenue of the business for the chosen period], input[Total Revenue]}, row{label[Enter the total cost of goods sold (COGS) during the same period], input[Cost of Goods Sold]}, label[Gross Profit], row{input[Gross Profit], label[]}, row{label[Enter the total operating expenses during the same period], input[Operating Expenses]}, label[Net Profit], row{input[Net Profit], label[]}, row{label[Enter the total cash flows from investing activities (e.g. purchase of assets, investments)], input[Investing Cash Flows]}, row{label[Enter the total cash flows from financing activities (e.g. loans, dividends, repayable)], input[Financing Cash Flows]}, label[Net Cash Flow], row{input[Net Cash Flow], label[]}}"
    prompt_examples += ", Example 9: For a tutor for a three members rational equation, the representation would be title[Rational Equations], column{label[Solve the rational equation], row{column{input[Numerator 1], label[___], input[Denominator 1]}, label[+], column{input[Numerator 2], label[___], input[Denominator 2]}, label[=], column{input[Numerator 3], label[___], input[Denominator 3]}}}"


    # Combining all the parts to form the complete prompt
    prompt = f"{prompt_system}\n{prompt_introduction}\n\n{prompt_format}\n\n{prompt_design_instructions}\n\n{prompt_examples}\n\n{prompt_task}"
    instruction = f"\nDetailed Description:\n{detailed_description}\n"

    # Format the prompt with the detailed description from the request
    #prompt = f"""Given a detailed description of a tutor interface, generate a compact representation layout string in a specific format. The format includes titles, rows, columns, labels, and inputs, represented as follows: title[Title], row {{ ... }}, column {{ ... }}, label[Label], and input[Placeholder]. Elements inside rows and columns should be enclosed in curly braces {{}}, and element attributes should be enclosed in square brackets []. Ensure the output is precise and adheres to this structure for easy parsing.
    #Design instructions: Given that the intelligent tutor will utilize an AI algorithm to learn from the teacher interaction what the problem solution is; each input element should be separate, for example in an equation there should be one input element per digit. Respect design principles; for example, a single equation must be in a single line. 
    #Detailed Description:
    #{detailed_description}
    #Transform this description into the compact representation layout string according to the instructions. Respond in one line."""

    try:
        response = openai.chat.completions.create(
          model="gpt-4", # Adjusted to use GPT-4
        messages=[{"role": "system", "content": prompt}, {"role": "user", "content": instruction }]
        )
        generated_text = response.choices[0].message.content.strip()
        print(generated_text)
        # Return the compact layout generated by OpenAI
        return jsonify({"compactLayout": generated_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/update_tutor_online", methods=['POST'])
def update_tutor_online():

    request_data = request.get_json()

    IsOnline = request_data['IsOnline']

    id = request_data['id']

    conn = get_db_connection()

    conn.execute(
        'UPDATE tutors SET IsOnline=? WHERE id=?', (IsOnline, id))

    conn.commit()

    toReturn = {"return": "True"}

    conn.close()

    return jsonify(toReturn)


@app.route("/update_tutor_follow_online", methods=['POST'])
def update_tutor_follow_online():

    request_data = request.get_json()

    follows = request_data['follows']

    id = request_data['id']

    conn = get_db_connection()

    conn.execute(
        'UPDATE tutors SET follows=? WHERE id=?', (follows, id))

    conn.commit()

    toReturn = {"return": "True"}

    conn.close()

    return jsonify(toReturn)



# Rename
@app.route("/rename", methods=['POST'])
def rename():
    # print("This is tutor_rename function!!!!!!")

    request_data = request.get_json()

    Id = request_data['Id']

    tutorName = request_data['tutorName']

    # print(Id, tutorName)

    conn = get_db_connection()

    conn.execute(
        'UPDATE tutors SET tutor_name=? WHERE id=?', (tutorName, Id))

    conn.commit()

    toReturn = {"return": "True"}

    conn.close()

    return jsonify(toReturn)




# Delete
@app.route("/delete", methods=['POST'])
def delete():
    # print("This is tutor_delete function!!!!!!")

    request_data = request.get_json()
    print(request_data)

    Id = request_data['Id']

    conn = get_db_connection()

    conn.execute(
        'DELETE FROM tutors WHERE id=?', (Id,))
    conn.commit()

    toReturn = {"return": "True"}

    conn.close()
    return jsonify(toReturn)


# Edit
@app.route("/tutor_edit", methods=["GET", 'POST'])
def tutor_edit():
    resp = check_token()
    if resp.get("error"):
        if "redirect" in resp:
            return redirect(url_for(resp["redirect"]))
        else:
            return jsonify(resp["error"]), resp["error_code"]
    token = resp["token"]

    tutor_id = request.get_json()['Id']
    content = tutor.get_tutor(tutor_id)["content"]

    return jsonify({"tutor": content, "tutor_id": tutor_id})


# Save
@app.route("/save", methods=['POST'])
def save():

    tutor.save(request.get_json())
    return jsonify({"return": "True"})


###################################################
# Helper methods
###################################################

@app.route('/upload_file', methods=['GET', 'POST'])
def upload_file():
    from io import StringIO
    # print("GOT TO UPLOAD")
    response = {"success": False, "error": ""}
    if request.method == 'POST':
        # print(request.method)
        # check if the post request has the file part
        # print(request.files)

        if 'file' not in request.files:
            # print("FILE NOT IN REQUEST FILES")
            response["error"] = "Post request does not contain file part."
        else:
            # print(request)
            # print(request.get_json())
            params = helpers.validate_params(data=request.get_json())
            if not params["agent_id"] or not params["state"]:
                # print("NO AGENT ID OR STATE")
                response["error"] = "No agent ID or state supplied. Can not upload file."
            else:
                # print("FILE IS GOOD")
                response = helpers.file_upload(request.files['file'], list(params["state"].keys()))
                if response["success"]:
                    all_problems = agent.get_agent_field(params["agent_id"], "user_problems")
                    if all_problems:
                        all_problems.extend(response["problems"])
                    else:
                        all_problems = response["problems"]
                    agent.update_agent(agent_id=params["agent_id"], column="user_problems", value=all_problems)

    return jsonify(response)


###########
# HELPERS #
###########





###################################################
###################################################

if __name__ == "__main__":
    database.setup(loads(open("config.json", "r").read()))
    app.run(debug=True)


