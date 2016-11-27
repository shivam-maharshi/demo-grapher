'''
Data transfer objects used for request and response data manipulation.

@author: shivam.maharshi
'''

class CollegeList(object):
    
    def __init__(self, cl):
        self.cl = cl

class College(object):
    
    def __init__(self, cc, cn):
        self.cc = cc
        self.cn = cn
        self.dl = []
        
class Department(object):
    
    def __init__(self, dc, dn):
        self.dc = dc
        self.dn = dn