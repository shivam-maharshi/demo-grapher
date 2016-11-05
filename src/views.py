from src import app
from flask.templating import render_template

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', message='Home Page for DemoGrapher')