import os, urllib

from flask import send_from_directory, request
from flask.templating import render_template

from src import app, config
from src.db import PGClient
from src.wrapper import JsonRequest, JsonResponse
from src.dto import College, Department

dbc = PGClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)

@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/message.html', methods=['GET'])
def view():
    return render_template('message.html')

@app.route('/test.html')
def test():
    return render_template('test.html')

@app.route('/data', methods=['POST'])
def data():
    rb = urllib.parse.unquote(request.data.decode('utf8'))
    r = JsonRequest(rb)
    return '{"a" : "a"}'

@app.route('/static/<path:path>')
def render_static_assets(path):
    return send_from_directory(os.getcwd() + '/static/', path)

@app.route('/favicon.ico')
def render_favicon():
    return send_from_directory(os.getcwd() + '/static/', 'favicon.ico')

@app.route('/colleges')
def list_all_colleges():
    dbc = PGClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)
    rows = dbc.execute('SELECT DISTINCT ON("Department") "College_code", "College", "Department_code", "Department" FROM "Student_residency";')
    lookup = {}
    cl = []
    for row in rows:
        dept = Department(row[2].strip(), row[3].strip())
        if not row[0].strip() in lookup:
            col = College(row[0].strip(), row[1].strip())
            lookup[row[0].strip()] = col
            cl.append(col)
        lookup[row[0].strip()].dl.append(dept)
    
    return JsonResponse(cl).json

@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'no-cache, no-store'
    response.headers['Pragma'] = 'no-cache'
    return response
