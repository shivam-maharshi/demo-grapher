import json

'''
@author: shivam.maharshi
'''

class JsonRequest(object):
    
    def __init__(self, j):
        self.__dict__ = json.loads(j)
        
class JsonResponse(object):
        
    def __init__(self, obj):
        self.json = json.dumps(obj, default=lambda o: o.__dict__)
