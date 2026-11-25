import sys, pathlib, unittest, contextlib, io
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
import bitget_connection_test as b
class Test(unittest.TestCase):
    def run_pilot(self, responses):
        calls=[]
        def call(p): calls.append(p); return responses[p]
        with contextlib.redirect_stdout(io.StringIO()): result=b.pilot(call)
        return result,calls
    def test_signature(self):
        self.assertEqual(b.signature('secret','123',b.UTA_INFO),'hsWc44Ca7Gtrxk8g+NFFbRUK5udCaxaSe97Vgx1gokY=')
    def test_uta_guard(self):
        for info in ({'permType':'read_and_write','permissions':['uta_mgt']},{'permType':'readonly','permissions':['withdraw']},{'permType':'readonly','permissions':['unknown']},{}):
            self.assertEqual(self.run_pilot({b.UTA_INFO:('00000',info)}),(False,[b.UTA_INFO]))
    def test_uta(self):
        self.assertEqual(self.run_pilot({b.UTA_INFO:('00000',{'permType':'read_only','permissions':['uta_mgt']}),b.UTA_ASSETS:('00000',{'assets':[]})}),(True,[b.UTA_INFO,b.UTA_ASSETS]))
    def test_classic(self):
        r={b.UTA_INFO:('HTTP 400, Bitget 40084',None),b.CLASSIC_INFO:('00000',{'authorities':list(b.CLASSIC_READ)})}
        r.update({p:('00000',[]) for _,p in b.CLASSIC_PROBES})
        self.assertEqual(self.run_pilot(r),(True,[b.UTA_INFO,b.CLASSIC_INFO]+[p for _,p in b.CLASSIC_PROBES]))
        r[b.CLASSIC_PROBES[-1][1]]=('HTTP 400, Bitget 40000',None)
        self.assertFalse(self.run_pilot(r)[0])
    def test_classic_guard(self):
        for perms in ([],['coor','coow'],['wtor'],['unknown'],None,[{}]):
            self.assertEqual(self.run_pilot({b.UTA_INFO:('HTTP 400, Bitget 40084',None),b.CLASSIC_INFO:('00000',{'authorities':perms})}),(False,[b.UTA_INFO,b.CLASSIC_INFO]))
    def test_no_fallback_on_auth_error(self):
        self.assertEqual(self.run_pilot({b.UTA_INFO:('HTTP 400, Bitget 40009',None)}),(False,[b.UTA_INFO]))
    def test_allowlist(self):
        with self.assertRaises(ValueError): b.request('/bad','x','x','x')
if __name__=='__main__': unittest.main()
