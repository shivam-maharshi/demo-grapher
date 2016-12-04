import os

from flask import send_from_directory, request
from flask.templating import render_template

from src import app
from src.config import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, COUNTRY_MAPPING, STATE_MAPPING, COUNTY_MAPPING
from src.db import PGClient
from src.wrapper import JsonRequest, JsonResponse
from src.dto import College, Department, Entity, Stats


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
    rb = request.data.decode('utf8')
    entity = get_response_entity(JsonRequest(rb))
    print(JsonResponse(entity).json)
    return JsonResponse(entity).json

def get_response_entity(req):
    dbc = PGClient(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT)
    rows = dbc.execute(prepare_data_query(req))
    LOOKUP = get_lookup_map(req.context)
    entities = {}
    for row in rows:
        if row[0]:
            entity_id = LOOKUP[row[0].strip()]
            if not entity_id in entities:
                entities[entity_id] = Stats()
            stats = entities[entity_id]
            stats.count += 1
            stats.college[int(row[1])] += 1
            stats.gender[int(row[2])] += 1
            stats.race[int(row[3])] += 1
    avg = 0
    min = 10000000000
    max = 0
    counts = []
    for country in entities:
        stats = entities[country]
        counts.append(stats.count)
        min = stats.count if (stats.count < min) else min
        max = stats.count if (stats.count > max) else max
        avg += stats.count
    avg = avg / (1 if len(entities) == 0 else len(entities))
    counts.sort()
    median = counts[int(len(counts)/2)]
    return Entity(req.context, avg, median, min, max, entities)

def get_lookup_map(context):
    if (context == 'world'):
        return COUNTRY_MAPPING
    elif (context == 'usa'):
        return STATE_MAPPING
    else:
        return COUNTY_MAPPING

def prepare_data_query(req):
    if (req.context == 'world'):
        s = 'SELECT "Nation", "College_code", "Gender_code", "Ethnicity_code" FROM "Student_residency" WHERE "Year"=' + str(req.year)
    elif (req.context =='usa'):
        s = 'SELECT "State_name", "College_code", "Gender_code", "Ethnicity_code" FROM "Student_residency" WHERE "Nation_code"=0 AND "Year"=' + str(req.year)
    else:
        s = 'SELECT "County_city", "College_code", "Gender_code", "Ethnicity_code" FROM "Student_residency" WHERE "Nation_code"=0 AND "State_name"=\'Virginia\' AND "Year"=' + str(req.year)
    
    if len(req.college) is not 9:
        s += ' AND ("College_code"::int8=' + str(req.college[0])
        i = 1
        for i in range(len(req.college)):
            s += ' OR "College_code"::int8=' + str(req.college[i])
        s += ')'
    
    if len(req.gender) is not 3:
        s += ' AND ("Gender_code"=' + str(req.gender[0])
        i = 1
        for i in range(len(req.gender)):
            s += ' OR "Gender_code"=' + str(req.gender[i])
        s += ')'
        
    if len(req.race) is not 9:
        s += ' AND ("Ethnicity_code"=' + str(req.race[0])
        i = 1
        for i in range(len(req.race)):
            s += ' OR "Ethnicity_code"=' + str(req.race[i])
        s += ')'
        
    if len(req.acad) is not 14:
        clause = []
        if 1 in req.acad:
            clause.append('"Graduate"=\'Y\'')
        else:
            if 4 in req.acad:
                clause.append('"Masters"=\'Y\'')
            else:
                if 11 in req.acad:
                    clause.append('"Entering_masters"=\'Y\'')
                elif 12 in req.acad:
                    clause.append('("Masters"=\'Y\' AND "Entering_masters"=\'N\')')
                
            if 5 in req.acad:
                clause.append('"Doctoral"=\'Y\'')
            else:
                if 13 in req.acad:
                    clause.append('"Entering_doctoral"=\'Y\'')
                elif 14 in req.acad:
                    clause.append('("Doctoral"=\'Y\' AND "Entering_doctoral"=\'N\')')

        if 2 in req.acad:
            clause.append('"Undergraduate"=\'Y\'')
        else:
            if 6 in req.acad:
                clause.append('"Entering_freshman"=\'Y\'')
                if 7 in req.acad:
                    clause.append('"Entering_transfer"=\'Y\'')
                elif 8 in req.acad:
                    clause.append('("Undergraduate"=\'Y\' AND "Entering_transfer"=\'N\')')
            elif 7 in req.acad:
                clause.append('"Entering_transfer"=\'Y\'')
                if 8 in req.acad:
                    clause.append('("Undergraduate"=\'Y\' AND "Entering_freshman"=\'N\')')
            elif 8 in req.acad:
                clause.append('("Undergraduate"=\'Y\' AND "Entering_freshman"=\'N\' AND "Entering_transfer"=\'N\')')

        if 3 in req.acad:
            clause.append('"DVM"=\'Y\'')
        else:
            if 9 in req.acad:
                clause.append('"Entering_DVM"=\'Y\'')
            elif 10 in req.acad:
                clause.append('("DVM"=\'Y\' AND "Entering_DVM"=\'N\')')
        
        s += ' AND (' + clause[0]
        i = 1
        while i < len(clause):
            s += ' OR ' + clause[i]
            i += 1
        s += ')'
    print(req.acad)
    print(s)
    return s

@app.route('/static/<path:path>')
def render_static_assets(path):
    return send_from_directory(os.getcwd() + '/static/', path)

@app.route('/favicon.ico')
def render_favicon():
    return send_from_directory(os.getcwd() + '/static/', 'favicon.ico')

@app.route('/colleges')
def list_all_colleges():
    dbc = PGClient(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT)
    #rows = dbc.execute('SELECT DISTINCT ON("Department") "College_code", "College", "Department_code", "Department" FROM "Student_residency";')
    rows = dbc.execute('SELECT "College_code", "College", "Department_code", "Department" FROM "Department";')
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

@app.route('/years')
def list_all_years():
    dbc = PGClient(DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT)
    rows = dbc.execute('SELECT DISTINCT "Year" FROM "Student_residency";')
    years = { 'years': [] }
    for row in rows:
        years['years'].append(int(row[0]))
    years['years'].sort()

    return JsonResponse(years).json

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
