from src import app
from flask import send_from_directory
from flask.templating import render_template

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', message='DemoGrapher is up and running!')

@app.route('/view')
def view():
    return render_template('view.html')

@app.route('/assets/<path:path>')
def send_js(path):
    return send_from_directory('assets/', path)