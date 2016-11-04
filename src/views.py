from src import app

@app.route('/')
@app.route('/index')
def index():
    return "hello from the other side!"