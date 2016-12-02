'''
Data transfer objects used for request and response data manipulation.

@author: shivam.maharshi
'''

class College(object):
    
    def __init__(self, cc, cn):
        self.cc = cc
        self.cn = cn
        self.dl = []

class Department(object):
    
    def __init__(self, dc, dn):
        self.dc = dc
        self.dn = dn

class Entity(object):

    def __init__(self, avg, min, max, values):
        self.avg = avg
        self.min = min
        self.max = max
        self.values = values

class Stats(object):
    
    def __init__(self):
        self.count = 0
        self.college = {1:0, 2:0, 3:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0}
        self.gender = {1:0, 2:0, 3:0}
        self.race = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0}
