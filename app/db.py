import json
from datetime import datetime, timedelta

DATE_PATTERN = '%Y-%m-%d'


class DB(object):
    def __init__(self, *data_files):
        if not data_files:
            data_files = (
                'data/YHOO.json',
                'data/GOOG.json',
                'data/AAPL.json',
                'data/MSFT.json',
                'data/BA.json',
                'data/RIO.L.json',
                'data/BLT.L.json',
                'data/AMZN.json',
                'data/RAX.json',
                'data/C.json',
                'data/GS.json',
                'data/TSCO.L.json',
                'data/SBRY.L.json',
                'data/F.json',
                'data/TM.json')

        # read in, find min/max dates
        symbol_data = {}
        self._start_date = datetime.max
        self._end_date = datetime.min
        for f in data_files:
            symbol = f.split('/')[-1].replace('.json', '')
            symbol_data[symbol] = []
            with open(f) as fs:
                vals = json.load(fs)['query']['results']['quote'][::-1]
                prev_close, prev_date = None, None
                for vs in vals:
                    close = float(vs['Close'])
                    date = datetime.strptime(vs['Date'], DATE_PATTERN)
                    symbol_data[symbol].append((date, close))
                    self._start_date = min(self._start_date, date)
                    self._end_date = max(self._end_date, date)

        # print 'Start date: %s, end date: %s' % (self._start_date.strftime(DATE_PATTERN), self._end_date.strftime(DATE_PATTERN))

        # fix up data gaps
        for symbol, vals in symbol_data.iteritems():
            # fix up start dates - fake, backfiling...
            act_start, act_start_close = vals[0]
            if act_start != self._start_date:
                vals.insert(0, (self._start_date, act_start_close))

            # fix up end dates
            act_end, act_end_close = vals[-1]
            if act_end != self._end_date:
                vals.append((self._end_date, act_end_close))

            # forward fill in all gaps (holidays)
            prev_date, prev_close = vals[0]
            new_vals = [(prev_date, prev_close)]
            for i in xrange(1, len(vals)):
                date, close = vals[i]
                for j in xrange(1, (date-prev_date).days):
                    # print 'backfill: ', symbol, prev_date + timedelta(j), close
                    new_vals.append((prev_date + timedelta(j), close))
                # print 'append: ', symbol, date, close
                new_vals.append((date, close))
                prev_date, prev_close = date, close

            symbol_data[symbol] = new_vals
            # print 'Fixed up dates for symbol %s: range: %s - %s, length: %d' % (symbol, vals[0][0].strftime(DATE_PATTERN), vals[-1][0].strftime(DATE_PATTERN), len(vals))

        # save dates and vals
        self._symbol_data = {}
        for symbol, vals in symbol_data.iteritems():
            self._dates, self._symbol_data[symbol] = zip(*vals)

    @property
    def symbols(self):
        return self._symbol_data.keys()

    @property
    def start_date(self):
        return self._start_date

    @property
    def end_date(self):
        return self._end_date

    @property
    def dates(self):
        return [d.strftime(DATE_PATTERN) for d in self._dates]

    def data(self, symbols, start_date, end_date):
        start_ind = (start_date - self.start_date).days
        end_ind = (end_date - self.start_date).days
        symbols = [symbol for symbol in symbols if symbol in self._symbol_data]
        return {
            'rows': symbols,
            'cols': [d.strftime(DATE_PATTERN) for d in self._dates[start_ind:end_ind+1]],
            'vals': [self._symbol_data[symbol][start_ind:end_ind+1] for symbol in symbols]
        }
