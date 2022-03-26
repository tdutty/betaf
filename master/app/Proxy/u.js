let t = ["Lisinopril","Atorvastatin","Levothyroxine","Amlodipine","Metoprolol","Omeprazole","Simvastatin","Albuterol","Gabapentin","Fluticasone","Montelukast","Furosemide", "Alprazolam", "Prednisone", "Bupropion","Acetaminophen","Citalopram","Dextroamphetamine","Carvedilol","Glipizide","Duloxetine","Methylphenidate","Ranitidine","Venlafaxine","Allopurinol","Ergocalciferol","Azithromycin","Metronidazole","Loratadine","Lorazepam","Estradiol","Lamotrigine","Glimepiride","Cetirizine","Paroxetine","Fenofibrate","Naproxen","Pregabalin","Topiramate","Bacitracin","Clonidine","Latanoprost","Tiotropium","Ondansetron","Lovastatin","Valsartan","Finasteride","Amitriptyline","Esomeprazole","Tizanidine","Apixaban"]
let x = []

function random(low, high) {
    return Math.round(Math.random() * (high - low) + low)
  }

function random_item(items){
return items[Math.floor(Math.random()*items.length)];
     
}
let v =["2","w","W","s","s","5"]
v.forEach(function g () {
   let u = random_item(t)
   let n = random(999, 7)
   x.push({u,n})
})


console.log(x)