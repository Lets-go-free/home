import sys, pathlib, unittest, contextlib, io
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
import bitget_connection_test as b
class Test(unittest.TestCase):
    def test_signature(self):
        self.assertEqual(b.signature('secret','123','/api/v3/account/info'),'hsWc44Ca7Gtrxk8g+NFFbRUK5udCaxaSe97Vgx1gokY=')
    def test_guard(self):
        for info in ({'permType':'read_and_write','permissions':[]},{'permType':'readonly','permissions':['withdraw']},{}):
            calls=[]
            def call(p): calls.append(p); return '00000',info
            with contextlib.redirect_stdout(io.StringIO()): self.assertFalse(b.pilot(call))
            self.assertEqual(calls,[b.PATHS[0]])
    def test_success(self):
        responses=iter([('00000',{'permType':'readonly','permissions':['uta_mgt']}),('00000',{'assets':[]}),('HTTP 400, Bitget 40000',None)])
        with contextlib.redirect_stdout(io.StringIO()): self.assertTrue(b.pilot(lambda p:next(responses)))
    def test_allowlist(self):
        with self.assertRaises(ValueError): b.request('/bad','x','x','x')
if __name__=='__main__': unittest.main()
