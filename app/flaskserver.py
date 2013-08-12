from flask import Flask, render_template
import json
from datetime import datetime, timedelta
from db import DB

app = Flask(__name__)
app.secret_key = 'my secret...'

db = DB()
DATE_PATTERN = '%Y-%m-%d'

######### Abourget moo - for s3 directives


@app.route('/portfolio')
def portfolio():
    cols = {'cnt': len(db.dates), 'visible': 10, 'buffer': 50}
    rows = {'cnt': len(db.symbols), 'visible': 5, 'buffer': 5}
    initial_data = db.data(
        db.symbols,
        db.start_date,
        db.start_date + timedelta(days=cols['visible']+cols['buffer']))
    return render_template(
        'portfolio.html',
        symbols=db.symbols,
        start_date=db.start_date,
        cols=cols,
        rows=rows,
        initial_data=initial_data)


@app.route('/api/symbols/<symbols>/start_date/<start_date>/end_date/<end_date>')
def partial(symbols, start_date, end_date):
    symbols = symbols.split(',')
    start_date = datetime.strptime(start_date, DATE_PATTERN)
    end_date = datetime.strptime(end_date, DATE_PATTERN)
    print symbols, start_date, end_date
    return json.dumps(db.data(symbols, start_date, end_date))


if __name__ == "__main__":
    app.run(debug=True)
