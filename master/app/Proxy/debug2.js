//Change the host name to the server ip address and open it to outside connection
//Remember to update packages
//Add database to handle cache storage.
//change the client node to the api endpoint and the hostname to server host 
//Rewrite the url Request parmeters to handle exceptions.
//I need to write error handling protocol for server hangups and failed connections. 
 //I need to write error handling protocol for server hangups and failed connections.
// should the db calls be handled asynchronously.
// change elasticsearch cli host name


const cluster = require('cluster');
const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy')
const fs = require('fs')
const numCPUs = require('os').cpus().length;
const mongoose = require('mongoose')
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node:{
    url : new URL('http://localhost:9230')
    }
})
const port = 8787;
const hostname = '152.44.36.25';
const NodeCache = require( "node-cache" );
const myCache = new NodeCache({stdTTL : 0} ) ;
const fetch = require('node-fetch');
const crypto = require('crypto-js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const router = express.Router();
const nodemailer = require('nodemailer');


const corsOptions = {
    origin : true,
    credentials: true
}

app.use(function(req,res,next){
 if(req.secure){
	return next();
	}
 res.redirect("https://" + req.headers.host +req.url)
})

app.use(cors(corsOptions))

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(bodyParser.json());

function random(low, high) {
    return Math.round(Math.random() * (high - low) + low)
}

  function random_item(items) {
    return items[Math.floor(Math.random()*items.length)];     
}

let perfunc = ["2","w","W","s","s","5","e"]

let t = ["Lisinopril","Atorvastatin","Levothyroxine","Amlodipine","Metoprolol","Omeprazole","Simvastatin","Albuterol","Gabapentin","Fluticasone","Montelukast","Furosemide", "Alprazolam", "Prednisone", "Bupropion","Acetaminophen","Citalopram","Dextroamphetamine","Carvedilol","Glipizide","Duloxetine","Methylphenidate","Ranitidine","Venlafaxine","Allopurinol","Ergocalciferol","Azithromycin","Metronidazole","Loratadine","Lorazepam","Estradiol","Lamotrigine","Glimepiride","Cetirizine","Paroxetine","Fenofibrate","Naproxen","Pregabalin","Topiramate","Bacitracin","Clonidine","Latanoprost","Tiotropium","Ondansetron","Lovastatin","Valsartan","Finasteride","Amitriptyline","Esomeprazole","Tizanidine","Apixaban"]
let trends = []



isEmpty = (obj) => { 
    for (var key in obj) {
      if(obj.hasOwnProperty(key))
        return false
    }
    return true 
  }

var headers = {
    'Authorization': 'f1f394d160ae63e4c59081c6a61ecdf6'
};

var options = {
    headers: headers
};


const specVal = (y) => ({
    'General+Medicine' : ['Absorica','Savella','Amikacin Sulfate','Cetraxal','Otiprio','Rezira','Tessalon','Humira','Crestor','Nexium','Mekinist','Elimite','Amphotericin B','Cayston','Relenza diskhaler'],
    "Physical+Medicine+%26+Rehabilitation": ['ampyra','Exparel','Forteo','Actimmune','Zubsolv','Prialt','Tysabri', 'Apokyn','Azilect','Stalevo','Gilenya','ilaris','lyrica','Aubagio','Copaxone'],
    "Dermatology":['Refissa','Duac','Ziana','Altabax','Centany','Ovace','Efudex','Tolak','Elimite','Cordran','Benzaclin','Varithena','Minocin','Doryx','Solodyn'],
    "Cardiovascular": ['Hyzaar','Valsartan','Moexipril Hydrochloride','Cardene','Corgard','Natrecor','Digoxin','Aldactone','Methyldopa','Avapro','Lidocaine','Ranexa','Inspra','Carospir','Tenex'],
    "Anesthesiology":['sumatriptan','Amrix','Cyclobenzaprine','Gralise','Lidoderm','Daypro','Feldene','Indocin','Mobic','Ponstel','Bloxiverz','Dopram','Nalbuphine','lidocaine','Diprivan'],
    "Obstretics%26Gynecology" :['Amethia','Cetrotide','Zoladex','clomiphene','Activella','Angeliq','Estradiol','Lysteda','Provera','Methergine','Osphena','Vandazole','Nuvessa','Clindesse','Altavera'],
    "Hematology" :['Sensipar','Isentress','Onglyza','Selzentry','Victoza','Lysodren','Myleran','Matulane','Evomela','bendeka','Coagulation factor IX','Amphotericin B','Pradaxa','Promacta','Samsca'],
    "Oncology" :['Tasigna','Proleukin','Lynparza','Votrient','Lysodren','Myleran','Hexalen','Tepadina','Matulane','Alkeran','Velcade','Zykadia','Oncaspar','Revlimid','Yondelis'],
    "Psychiatry" :['Trintellix','Vyvanse','Viibryd','Rozerem','Abilify','Vimpat','Armodafinil','Cambia','Fanapt','Invega sustenna','Latuda','Xyrem','Fetzima','Pristiq','adasuve'],
    "Pulmonary" :[ 'Kalydeco', 'Ranexa', 'Primatene', 'Brovana', 'ProAir RespiClick' ],
    "Radiology" :['Zytiga','Abraxane','Adcetris','Afinitor','combivir','Axumin','Gazyva','Jakafi','Kepivance','Lenvima','amitiza','zydelig','Imbruvica','Odomzo','Venclexta'],
    "Urology" :['Anaspaz','Gelnique','flavoxate hydrochloride','Avodart','Jalyn','Stimate','Urecholine','Samsca','valprisol','Zyloprim','Cuprimine','Actigall','Uristat ultra','methenamine hippurate','Nitrofurantoin Macrocrystals'],
    "Opthalmology" :['Pazeo','Lucentis','Visudyne','Zirgan','Durezol','Alcaine','Maxitrol','Azasite','Azelastine Hydrochloride','Flarex','Zymaxid','Vigamox','Natacyn','ALaway','Patanol'],
    "Endocrine" :['cinacalcet','hectorol','Sensipar','Zemplar','omnipred','Rayos','acarbose','Precose','SymlinPen','Zoladex','amiloride hydrochloride','Aldactone','Lupron Depot','methitest','calcitriol'],
    "Emergency+Medicine" :['Ranexa','Sotalol Hydrochloride','Catchflo Activase','Inspra','Carospir','Hyzaar','Adenocard','Isoproterenol hydrochloride','Milrinone lactate','akovaz','MYORISAN','Exparel','Narcan','Acephen','Pradaxa'],
    "Internal+Medicine" :['Bystolic','Cipro','Clonidine hydrochloride','Crestor','argatroban','Daliresp','Dexilant','Edarbyclor','EGgrifta','Exforge HCT','Axiron','Aranesp','Benlysta','Brilinta','Brovana'],
    "Preventative+Medicine" :['Bystolic','bisoprolol fumarate','Avapro','Ezetimibe and simvastatin','Welchol','altoprev','Clopidogrel','aggrenox','Pravachol','Candesartan cilexetil','Effient','Altoprev','Xarelto','Captopril','Livalo'],
    "Pain+Medicine" :['Ultram','Nembutal sodium','Exparel','Dexilant','Lumigan','Pradaxa','Acetadote','Evzio','Mephtyon','sumatriptan','Gilenya','Prialt','Fexmid','Savella','Lidocaine'],
    "Dental+Provider" :['Ultram','Nembutal sodium','Exparel','Dexilant','Lumigan','Pradaxa','Acetadote','Evzio','Mephtyon','sumatriptan','Gilenya','Prialt','Fexmid','Savella','Lidocaine'],
    "Pediatrics" :['Kepivance','cevimeline hydrochloride','Ethyol','Salagen','Denavir','Amoxil','Atridox','Peridex','Canesten v','Fluconazole','Kovanaze','Diflucan','vfend','Noxafil','Abreva'],
    "Pediatrics" :['Gilenya','Ilaris','Kalydeco','Promacta','Relenza','Vesicare','Zithromax','Absorica','Pazeo','Alaway','Ambisome','Banzel','Cayston','Elaprase','Elimite'],
    "Neurology" :['Razadyne','Apokyn','Azilect','benzotropine mesylate','Stalevo','Fexmid','Gabapentin','neostigmine methylsulfate','Mestinon','Rilutek','Rebif','Tysabri','Xyrem','Banzel','Aricept'],
    "Plastic+Surgery" :['atropine','bloxiverz','vimovo','mestinon','miostat','Ultiva','nalbuphine hydrochloride','cefazolin','nalfon','cefotan','Plavix','Ticlopidine hydrochloride','Persantine','ativan','Alfentanil hydrochloride'],
    "Allergy%26Immunology" :['Pegasys','Plegridy Pen','sulfasalazine','Plaquenil','Inflectra','pataday','Rapamune','Ridaura','Extavia','Avonex','Kineret','Benlysta','Rituxan','Azasan']
})[y]



const specCat = (x) => ({
    'New-Medications' :['Olumiant','Palynziq','Doptelet','veltassa','Aimovig','Lucemyra','Akynzeo',  'Crysvita','Tavalisse','Ilumya','Trogarzo','xofluza','Symdeko','Biktarvy','Lutathera','Erleada','Lucemyra'],
    'Popular-Medications' :['Crestor','Humira','Avastin','Januvia','Xarelto','Opdivo','Neulasta','tecfidera','Harvoni','Nexium','Enbrel','deltasone','amoxil','prinivil','cozaar','zithromax','meloxicam'],
    'New-Medical-Devices' :['SYNOJOYNT™ – P170016','PartoSure Test - P160052',' Medtronic DBS System for Epilepsy - P960009/S219','Medtronic IN.PACT™ Admiral™ ','Paclitaxel-Coated PTA Balloon Catheter - ','P140010/S037','AngelMed Guardian System - P150009','GORE® CARDIOFORM Septal Occluder - P050006/S060','Guardian Connect System – P160007','Abbott Perclose ProGlide Suture-Mediated Closure System - P960043/S097','MiniMed 630G System with SmartGuard - P150001/S01','Impella Ventricular Support Systems - P140003/S018'],
    'Dermatology' :['ACZONE','tretinoin','COSENTYX',  'COTELLIC','Otezla',  'Zelboraf','BENLYSTA','stelara','minoxidil','Finacea','Adoxa'],
    'Cardiovascular' :['corlanor','ENTRESTO','FIRAZYR','FRAGMIN','GILENYA','Letairis','definity','ORENITRAM','ORKAMBI','PRADAXA','Ranexa','REVATIO','TEKTURNA'],
    'Anesthesiology' :['actemra','seroquel','avastin','belviq','bydureon BCise','bridion','brilinta','lovaza','embeda','feiba','feraheme','exalgo','exparel','eliquis','movantik','prialt','hydroxyzine hydrochloride'],
    'Obstetrical' :['NUVESSA','Avastin','DUAVEE','ENDOMETRIN','ESTRACE','hydroxyprogesterone caproate','Osphena','TOVIAZ','Vesicare','clindesse'],
    'Hematology' :['jardiance','feiba','lantus solostar','epogen','orencia','effient','FRAGMIN','NINLARO','PRADAXA','TOUJEO'],
    'oncology' :['ibrance',       'opdivo','abraxane',      'cyramza','DALIRESP',      'ELIQUIS','GILOTRIF',    'Herceptin','IMLYGIC',     'LEMTRADA','keytruda',      'NINLARO',     'Revlimid','ZYTIGA',    'Kepivance'],
    'Immunology' :['Creon','FIRAZYR','Kineret','Benlysta','Rituxan hyclela','Azasan','Imuran','Rapamune','Ridaura','Extavia','Avonex'],
    'Gastroenterology-and-Urology' :['Entyvio','KRYSTEXXA','LINZESS','Myrbetriq','SEEBRI neohaler','Uloric','VIBERZI','Amitiza','entecavir','GATTEX'],
    'Radiology' :['lubiprostone','Ibrutinib','IMBRUVICA',       'ODOMZO','Venclexta','ZYTIGA','Abraxane',     'ADCETRIS','AFINITOR','Axumin',       'GAZYVA','JAKAFI',    'Kepivance','Lenvima',     'LIPIODOL'],
    'Urology' :['BENLYSTA','COSENTYX','CUBICIN RF','firmagon','INLYTA','JEVTANA','LEUPROLIDE','SUTENT','TOVIAZ','Uloric','VOTRIENT'],
    'Ophthalmic' :['LUMIGAN','RESTASIS','XIIDRA','COMBIGAN','besivance','levofloxacin','Moxeza','Polycin','Ocuflox','levaquin','tobrex'],
    'Physical-Medicine' :['GILENYA',    'ilaris','lyrica',   'AUBAGIO','Copaxone',    'AMPYRA','EXPAREL',    'Forteo','ACTIMMUNE',    'Prialt','zubsolv'],
    'New-Medical-Devices' :['SYNOJOYNT™ – P170016','PartoSure Test - P160052',' Medtronic DBS System for Epilepsy - P960009/S219','Medtronic IN.PACT™ Admiral™ ' +'Paclitaxel-Coated PTA Balloon Catheter - ' +'P140010/S037','AngelMed Guardian System - P150009','GORE® CARDIOFORM Septal Occluder - P050006/S060','Guardian Connect System – P160007','Abbott Perclose ProGlide Suture-Mediated Closure System - P960043/S097','MiniMed 630G System with SmartGuard - P150001/S01','Impella Ventricular Support Systems - P140003/S018'],
    'Specialty-Pharmaceuticals' :['Sandostatin',    'Lucemyra','Vivivtrol',  'Dofetilide','Arcalyst',   'Pulmozyme','Omnitrope',    'Increlex','Mozobil',    'Neupogen','entecavir',      'Epivir','Moderiba',     'vemlidy','Torisel' ],
    'Dental' :['zazole',   'noxafil','abreva',    'xerese','kepivance',    'Exovac', 'Ethyol',   'Salagen','sporanox',  'NebuPent','vfend']
})[x]


mongoose.connect('mongodb://terrellgilb5:Tremaine@localhost:27017/msg_Storage', {useNewUrlParser: true});

let db = mongoose.connection;

db.once('open', (dbOpen) => {
  console.log("mongodb connected")
});



        
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {


    
    impressions = (e) => {
	s = e.url.split("=")
	a = s[s.length-1]
	q = a.split('-')
	db.collection('impressions').updateOne({name:q},{$inc:{impressions:1}})
} 
   

    app.post("/main/", cors(), (req,res) => {

        let newmeds = [
            {"Brand":"Rinvoq", "manufacturer":"Abbvie", "Generic":"upadacitinib", "Route": "Oral", "type":"Inhibitor"},
            {"Brand":"Harvoni", "manufacturer":"Gilead", "Generic":"Ledipasvir-Sofosbuvir", "Route": "Oral", "type":"Inhibitor"},
            {"Brand":"Repatha", "manufacturer":"Amgen", "Generic":"evolocumab", "Route": "Injection", "type":"Inhibitor"}
            ]


            let secmeds = [
                {"Brand":"Rinvoq", "manufacturer":"Abbvie", "Generic":"upadacitinib", "Route": "Oral", "type":"Inhibitor"},
                {"Brand":"Harvoni", "manufacturer":"Gilead", "Generic":"Ledipasvir-Sofosbuvir", "Route": "Oral", "type":"Inhibitor"},
                {"Brand":"Repatha", "manufacturer":"Amgen", "Generic":"evolocumab", "Route": "Injection", "type":"Inhibitor"}
                ]
        

        const spec = req.body.params.replace("+", " ");
        const mainpArr = specVal(spec);
        let mdvice = [{"terms":[{"definition":"The Zenith Dissection Endovascular System is a flexible, metal tube covered with fabric (stent graft) with an optional bare stent (flexible, metal tube that is not covered with fabric) that are supplied on separate long, thin, tube-like devices (delivery catheters). The Zenith Dissection Endovascular System is intended for the treatment of patients who have a tear (dissection) in the inside lining of the large artery in their chest (descending thoracic aorta), which allows blood to flow between the layers of the aortic wall, causing separation of these layers.","name":"Zenith® Dissection Endovascular System "}],"info":[{"code":"","openfda":{"regulation_number":"","medical_specialty_description":"Woven EndoBridge (WEB) Aneurysm Embolization System","device_class":"","device_name":"Zenith® Dissection Endovascular System"},"name":"Endovascular Stent Graft"}],"manufacturer":"William Cook Europe ApS","Brand":"Zenith® Dissection Endovascular System","safety":null,"count":null,"sterilization":null,"storage":null,"size":null},{"terms":[{"definition":"A material which is used to establish known points of reference for an assay intended to be used for the quantitative measurement of ferritin in a clinical specimen.","name":"Ferritin IVD, calibrator"}],"info":[{"code":"LGW","openfda":{"regulation_number":"","medical_specialty_description":"Not Available","device_class":"3","device_name":"Diazyme"}}],"manufacturer":"DIAZYME LABORATORIES, INC.","Brand":"Diazyme","safety":"Labeling does not contain MRI Safety Information","count":"1","sterilization":null,"storage":null,"size":null},{"terms":[{"definition":"A material which is used to establish known points of reference for an assay intended to be used for the quantitative measurement of ferritin in a clinical specimen.","name":"Ferritin IVD, calibrator"}],"info":[{"code":"LGW","openfda":{"regulation_number":"","medical_specialty_description":"Not Available","device_class":"3","device_name":"Diazyme"}}],"manufacturer":"DIAZYME LABORATORIES, INC.","Brand":"Diazyme","safety":"Labeling does not contain MRI Safety Information","count":"1","sterilization":null,"storage":null,"size":null}]
        
        db.collection('msg_').find({}).sort({_id:1}).limit(12).toArray((_error, result2) =>{ 
                db.collection('msg_med_Comments').find({}).sort({_id:1}).limit(80).toArray((_error2, result) =>{
                    db.collection("appMain").aggregate([{$sample : {size: 9}}]).toArray((_error3, result3 ) => {                  
                        res.writeHead(200, {'Content-Type': 'text/html'})
                        let y = [{"comments":result, "msg": result2, "data":result3, "devices":mdvice, "new": newmeds, "sec":newmeds}]
                        res.end(JSON.stringify(y))
                })
            })
        })
    })

    app.get("/devices*", (req,res ) => {
        let y = req.url.split("/")[req.url.split("=").length - 1]
	let x = y.split("=")[1]
        db.collection("mddata").find({"Brand":new RegExp(x, "i"),}).stream().limit(1).toArray((error, result) => {
		let d = [{"data":result}]
		res.end(JSON.stringify(d))
	})
    })

    app.get("/medication*", (req,res,next ) => {
	impressions(req)
        re = req.url.split("=")
        let x = re[re.length - 1]
	let q = x.split("-")[0]
	
        console.log(q)
        db.collection("api").find({"name": new RegExp(q, "i"), }).stream().limit(1).toArray((_error, result) => {
		db.collection("msg_med_Comments").find({"DrugName": new RegExp(q,"i"),}).stream().limit(35).toArray((error2, result2) => { 
            if(isEmpty(result) == true ) {
                res.redirect("https://aumnio.com/app/404.html")
                res.end()
            		} else {
                	 let y = [{"data": result, "docMsgs":result2}]
               		 res.end(JSON.stringify(y))
           		 }
		})

        }) 
    })

    app.post("/recentlyviewed/", (req,res ) => { 
        let querystr = req.body.querystr
        for (let i = 0; i < querystr; i++ ) { 
            db.collection("data").find({Brand: querystr[i] }).limit(1).toArray((_error, result1) => { 
                    dyno.push(result1)
            })
        }
        res.end(JSON.stringify(dyno))
    })

    app.get("/dash*", (req,res ) => {
        str = req.query.q.split("-")
	console.log(str)
        let userID = crypto.MD5(str[1] + str[2] + str[0].replace("+", " ")).toString();
        db.collection("msg_").find({}).sort({id:1}).limit(12).toArray((_error, result ) => {
            db.collection("msg_").find({userID:userID}).limit(6).toArray((_error2, result2) => {
		db.collection("pescbr").find({userID:userID}).toArray((error3, result3) =>{
			db.collection("note").find({userID:userID}).toArray((error4, result4)=> {
				db.collection("order").find({userID:userID}).toArray((err,resi) => { 
					db.collection("note").find({spec:str[0].replace("+"," ")}).sort({id:-1}).limit(15).toArray((_err2,resi2) => { 
						db.collection("note").find({}).sort({id:-1}).limit(15).toArray((err3,resi3) => {
                	perfunc.forEach(function () {
                    	let u = random_item(t)
                    	let n = random(999, 7)
                    	trends.push({u,n})
                 	})
                let x = {"msgs":result, "comm" : result2, "trends":trends, "pescbr":result3, "notes":result4, "order":resi, "specNotes":resi2,"faNotes":resi3} 
                res.end(JSON.stringify(x))
					})
				})
			  })
		     })
		})
            })
      })
})
    

    app.post("/dash/", (req,res ) => {
        let txt = req.body.text
        function escapeRegex(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        };
        const regex = new RegExp(escapeRegex(txt), 'gi');
        db.collection("msg_").find({Question:regex}).limit(4).toArray((error, result) => { 
            console.log(result)
            res.end(JSON.stringify(result))
        })
        
    })

    app.get("/cat/",(req, res) =>{ 
        let cat = req.query.q
        let x = specCat(cat)
        let y = []
    
            db.collection("api").aggregate([{$sample : {size: 30}}]).toArray((_error3, result) => {   
                res.end(JSON.stringify(result))
              })
        
        })

        

    app.post("/search/", (req, res) => {
        id = req.body.id
        text = req.body.text
            client.search({index:id,
             body:{ 
                    "query": { 
                        "fuzzy" : { 
                            "name" : {
                                "value": text,          
                            }
                        }
                    }
                }
            }).then(results => {        
                res.end(JSON.stringify(results.body.hits.hits))
            }).catch(error => {
                console.log(error)
                res.end(JSON.stringify(error))
 
            })

    })



    app.post("/support",(req,res ) => { 
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'terrellgilb5@gmail.com',
              pass: 'Tremaine90'
            }
          });
          
          var mailOptions = {
            from: 'terrellgilb5@gmail.com',
            to: 'terrellgilb5@gmail.com',
            subject: 'Aumnio Support' + req.body.first + req.body.last,
            text: req.body.text,
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
    })

    app.post("/avi",(req, rs) => { 
       let r = crypto.MD5(req.body.uf + req.body.ul + req.body.userSpec.replace("+", " "))
       res.end('https://res.cloudinary.com/dlmew3p6k/image/upload/v1565027636/w_200,h_200,c_thumb,g_face,r_max,e_sharpen/' + r)
    
    })

    app.post("/pescbr/", (req, res) => {
	db.collection("prescbr").insertOne({
	 text:req.body.text,
	 meds:req.body.meds,
	 dosage:req.body.dosage,
	 class:req.body.class,
	 first:req.body.first,
	 last:req.body.last,
	 userID:crypto.MD5(req.body.first + req.body.last + req.body.spec.replace("+", " ")).toString()

	}, function(error, result){
		console.log(error)
	})
		res.end("ok")
	})

    app.post("/notes", (req, res) => {
     if(req.body.text.length > 0) {
	console.log("ok")
	if(req.body.id == 1 ) {
	db.collection("note").insertOne({
	 id:req.body.id,
	 text:req.body.text,
	 title:req.body.titl,
	 subj:req.body.subj,
	 first:req.body.first,
	 last:req.body.last,
	 spec:req.body.spec,
	 privacy:req.body.priv,
	 replies: [],
	 userID:crypto.MD5(req.body.first + req.body.last + req.body.spec.replace("+", " ")).toString()
	}, function(error, result) {
		console.log(error)
		console.log(result)
		})
	}else {
	  db.collection("note").insertOne({
		id:req.body.id,
		text:req.body.text,
		title:req.body.titl,
		med:req.body.medication,
		dosage:req.body.dose,
		first:req.body.first,
		last:req.body.last,
		privacy:req.body.priv,
		replies:[],
		userID:crypto.MD5(req.body.first + req.body.last + req.body.spec.replace("+", " ")).toString()
		
	}, function(error, result){
		console.log(error)
		console.log(result)

		})
	}

   }
	res.end("ok")

})


    mailcli = () => { 

    }

    const options = {
	key: fs.readFileSync('/root/.getssl/api.aumnio.com/api.aumnio.com.key'),
	cert: fs.readFileSync('/root/.getssl/api.aumnio.com/api.aumnio.com.crt')

}


    const httpsServer = https.createServer(options,app)


    httpsServer.listen(port, () =>{console.log("port open")})


}  

