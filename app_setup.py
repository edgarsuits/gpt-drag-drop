from flask import Flask
from flask import jsonify
from flask import redirect
from flask import session
from flask import url_for
from functools import wraps
import jwt
import os


# config = json.load(open('config.json', 'r'))
config = {
    "SECRET_KEY": "6439355f702141479e42d47ae4f7ae68"
}
# create cache and session directories
if not os.path.exists('cache'):
    os.makedirs('cache')
if not os.path.exists('session'):
    os.makedirs('session')

# Setup the Flask app with the database
app = Flask(__name__)
app.config['SECRET_KEY'] = config['SECRET_KEY']
# 16MB file upload limit
app.config['MAX_CONTENT_LENGTH'] = 16 * 1000 * 1000


def token_required(func):
    # decorator factory which invokes update_wrapper() method and passes decorated function as an argument
    @wraps(func)
    def decorated(*args, **kwargs):
        # authorization = request.headers.get("authorization")
        token = session.get('token')
        if not token:
            return redirect(url_for('index'))
            # return jsonify({'Alert!': 'Token is missing!'}), 401
        try:
            # token = token
            # print(token)
            data = jwt.decode(token, config['SECRET_KEY'], algorithms='HS256')
        # You can use the JWT errors in exception
        # except jwt.InvalidTokenError:
        #     return 'Invalid token. Please log in again.'
        except Exception as e:
            return jsonify({"Error": "Error with token"}), 401
            # return jsonify({'Message': 'Invalid token'}), 403
        return func(*args, **kwargs)
    return decorated


def check_token():
    token = session.get('token')
    if not token:
        response = {"error": "Login", "redirect": "index"}
    else:
        try:
            token = jwt.decode(token, config['SECRET_KEY'], algorithms='HS256')
            response = {"token": token}
        except Exception as e:
            response = {"error": str(e), "error_code": 401}
    return response
