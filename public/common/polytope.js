var c = document.getElementById("background");
var ctx = c.getContext("2d");
var sign = new Image();

var dim1;	//first rotation axis dimension
var dim2;	//second rotation axis dimension
var delta;	//rotation speed
var d3;	//used in the projection from 3 to 2 dimensions
var d4;	//used in the projection from 4 to 3 dimensions
var zoom;	//zoom
var lw; //line width
var color; //brightness
var fancyEdges;
var vertexes;
var prev_time;
var stop_hysteresis;
var rotatedim0;
var rotatedim1;
var rotatedim2;
var rotatedim3;
var ptope;

function draw() {
	
	var cur_time = Date.now();
	var time_diff = cur_time-prev_time;
	prev_time = cur_time;
	ctx.clearRect(0,0, width, height);
	ptope.rotate(dim1,dim2,time_diff/4000*delta);
	ptope.draw();
}

function polytope() {
    this.edges = [];

    this.addedge = addedge;
    function addedge(edge) {
        this.edges[this.edges.length] = edge;
    }
	this.draw = draw;
	function draw() {
		this.edges.sort(function(e1,e2) {
			var z1 = e1.v1[2]/(e1.v1[3]+d4) + e1.v2[2]/(e1.v2[3]+d4);
			var z2 = e2.v1[2]/(e2.v1[3]+d4) + e2.v2[2]/(e2.v2[3]+d4);
			return z2 - z1;
		});
	
		for (var i=0; i < this.edges.length; i++) {
			this.edges[i].draw();
		}
	}
	this.rotate = rotate;
	function rotate(dim1, dim2, angle) {
		for (var i=0; i < this.edges.length; i++) {
			this.edges[i].rotate(dim1, dim2, angle);
		}
	}
	this.normalize = normalize;
	function normalize() {
		for (var i=0; i < this.edges.length; i++) {
			this.edges[i].normalize();
		}
	}
}

function edge(v1,v2) {
	this.v1 = v1.slice();
	this.v2 = v2;
	
	this.draw = draw;
	function draw() {
		var x1 = FourDtoTwoD(this.v1);
		var x2 = FourDtoTwoD(this.v2);
		
		d = scale*lw/(x1[2]+x2[2]);
		ctx.lineWidth = d;
		if (fancyEdges) {
			var c1 = Math.floor(color/x1[2]);
			var c2 = Math.floor(color/x2[2]);
			var grd = ctx.createLinearGradient(x1[0],x1[1],x2[0],x2[1]);
			var s1 = "rgb("+c1+","+c1+","+c1+")";
			var s2 = "rgb("+c2+","+c2+","+c2+")";
			grd.addColorStop(0,s1);
			grd.addColorStop(1,s2);
			ctx.strokeStyle = grd;
		}
		else {
			var cavg = Math.floor(2*color/(x1[2]+x2[2]));
			var s1 = "rgb("+cavg+","+cavg+","+cavg+")";
			var s2 = s1;
			ctx.strokeStyle = s1;
		}
		ctx.beginPath();
		ctx.moveTo(x1[0],x1[1]);
		ctx.lineTo(x2[0],x2[1]);
		ctx.stroke();
		
		if (vertexes || this.v1[3] < -.5) {	
			ctx.fillStyle = s1;
			ctx.beginPath();
			ctx.arc(x1[0],x1[1],d/2,0, 2*Math.PI);
			ctx.fill();
		if (vertexes || this.v2[3] < -.5)
			ctx.fillStyle = s2;
			ctx.beginPath();
			ctx.arc(x2[0],x2[1],d/2,0, 2*Math.PI);
			ctx.fill();
		}
	}
	
	this.rotate = rotate;
	function rotate(dim1, dim2, angle) {
		var t1 = this.v1.slice();
		t1[dim1] = Math.cos(angle) * this.v1[dim1] - Math.sin(angle) * this.v1[dim2];
		t1[dim2] = Math.cos(angle) * this.v1[dim2] + Math.sin(angle) * this.v1[dim1];
		var t2 = this.v2.slice();
		t2[dim1] = Math.cos(angle) * this.v2[dim1] - Math.sin(angle) * this.v2[dim2];
		t2[dim2] = Math.cos(angle) * this.v2[dim2] + Math.sin(angle) * this.v2[dim1];
		
		this.v1 = t1.slice();
		this.v2 = t2.slice();
	}
	this.normalize = normalize;
	function normalize() {
		var t1 = this.v1.slice();
		var d1 = Math.sqrt(t1[0]*t1[0] + t1[1]*t1[1] + t1[2]*t1[2] + t1[3]*t1[3]);
		t1[0] = t1[0]/d1;
		t1[1] = t1[1]/d1;
		t1[2] = t1[2]/d1;
		t1[3] = t1[3]/d1;
		var t2 = this.v2.slice();
		var d2 = Math.sqrt(t2[0]*t2[0] + t2[1]*t2[1] + t2[2]*t2[2] + t2[3]*t2[3]);
		t2[0] = t2[0]/d2;
		t2[1] = t2[1]/d2;
		t2[2] = t2[2]/d2;
		t2[3] = t2[3]/d2;
		
		this.v1 = t1.slice();
		this.v2 = t2.slice();
	}
}

function FourDtoTwoD(v) {
	var x = v[0]/(v[3] + d4);
	var y = v[1]/(v[3] + d4);
	var z = v[2]/(v[3] + d4) + d3;
	
	x = width/2 + x/z*zoom*scale;
	y = height/2 + y/z*zoom*scale;
	
	return [x,y,z];
}

var AllPermutations = [
	[1,2,3,4],	[1,2,4,3],	[1,3,2,4],	[1,3,4,2],	[1,4,2,3],	[1,4,3,2],
	[2,1,3,4],	[2,1,4,3],	[2,3,1,4],	[2,3,4,1],	[2,4,1,3],	[2,4,3,1],
	[3,1,2,4],	[3,1,4,2],	[3,2,1,4],	[3,2,4,1],	[3,4,1,2],	[3,4,2,1],
	[4,1,2,3],	[4,1,3,2],	[4,2,1,3],	[4,2,3,1],	[4,3,1,2],	[4,3,2,1]];
var EvenPermutations = [
	[1,2,3,4],	[1,3,4,2],	[1,4,2,3],
	[2,1,4,3],	[2,3,1,4],	[2,4,3,1],
	[3,1,2,4],	[3,2,4,1],	[3,4,1,2],
	[4,1,3,2],	[4,2,1,3],	[4,3,2,1]];
var All3Permutations = [
	[1,2,3,4], [1,3,2,4], [2,1,3,4], [2,3,1,4], [3,1,2,4], [3,2,1,4]];
var Even3Permutations = [[1,2,3,4], [2,3,1,4], [3,1,2,4]];
var IdPermutation = [[1,2,3,4]];
	
function addVertexes(v, PIs) {
	var temp = new Array();
	for(var b0 = -1; b0 < 2; b0+=2) {
	for(var b1 = -1; b1 < 2; b1+=2) {
	for(var b2 = -1; b2 < 2; b2+=2) {
	for(var b3 = -1; b3 < 2; b3+=2) {
		for(var i = 0; i<PIs.length; i++) {
			var newv = [b0*v[PIs[i][0]-1],b1*v[PIs[i][1]-1],b2*v[PIs[i][2]-1],b3*v[PIs[i][3]-1]];
			isnew = true;
			for(var j=0; j<temp.length; j++) {
				if(newv[0]==temp[j][0] && newv[1]==temp[j][1] && newv[2]==temp[j][2] && newv[3]==temp[j][3]) {
					isnew = false;
					break;
				}
			}
			if (isnew)
				temp.push(newv);
		}
	}}}}
	vs = vs.concat(temp);
}
function addEdges(treshold_dist) {
	for(var i=0; i < vs.length; i++) {
		for(var j=i+1; j < vs.length; j++) {
			var d = (vs[i][0]-vs[j][0])*(vs[i][0]-vs[j][0])
				  + (vs[i][1]-vs[j][1])*(vs[i][1]-vs[j][1])
				  + (vs[i][2]-vs[j][2])*(vs[i][2]-vs[j][2])
				  + (vs[i][3]-vs[j][3])*(vs[i][3]-vs[j][3]);
			if (d < treshold_dist)
				ptope.addedge(new edge(vs[i],vs[j]));
		}
	}
}

function setPolytope(type) {
	dim1 = 2;	//first rotation axis dimension
	dim2 = 0;	//second rotation axis dimension
	delta = 2;	//rotation speed
	d3 = 4;	//used in the projection from 3 to 2 dimensions
	d4 = 1.11;	//used in the projection from 4 to 3 dimensions
	zoom = 3;	//zoom
	lw = 0.3; //line width
	color = 400; //brightness
	fancyEdges = false;
	vertexes = true;
	prev_time = Date.now();
	stop_hysteresis = true;
	rotatedim0 = true;
	rotatedim1 = true;
	rotatedim2 = true;
	rotatedim3 = false;
	ptope = new polytope();
	
	if(type == "600cell") {
		zoom = 2.4;
		delta = 1.2;
		d4 = 0.95;
		d3 = 12;
		lw = 0.35;
		color = 900;
		vertexes = false;
	}
	if(type == "120cell") {
		delta = 1.3;
		lw = 0.1;
		zoom = 1.5;
		vertexes = false;
		d4 = 1.11;
	}
	if(type == "120cellv2") {
		dim1 = 2;
		dim2 = 3;
		delta = 1.3;
		lw = 0.12;
		zoom = 2;
		vertexes = false;
		d4 = 1.11;
		rotatedim2 = false;
	}
	if(type == "tesseract") {
		zoom = 2.4;
		dim1 = 0;
		dim2 = 2;
		d4 = 1.11;
	}
	if(type == "24cell") {
		dim1 = 1;
		dim2 = 2;
		zoom = 1.9;
		lw = 0.18;
		vertexes = false;
		d4 = 1.11;
	}
	if(type == "16cell") {
		zoom = 5;
		d4 = 1.3;
	}
	if(type == "cube" || type == "octahedron") {
		zoom = 2.4;
		fanceEdges = true;
	}
	if(type == "5cell" || type == "pentachoron") {
		d3 = 5;
		zoom = 4;
		lw = 0.4;
		fanceEdges = true;
	}
	
	
	var phi = (1 + Math.sqrt(5))/2;
	vs = new Array();

	if(type == "600cell") {
		addVertexes([1,1,1,1],IdPermutation);
		addVertexes([1,0,0,0],EvenPermutations);
		addVertexes([phi-1,1,phi,0],EvenPermutations);

		addEdges(3);
	}
	if(type == "120cell" || type == "120cellv2") {
		addVertexes([0,0,2,2],AllPermutations);
		addVertexes([1,1,1,Math.sqrt(5)],AllPermutations);
		addVertexes([(phi-1)*(phi-1),phi,phi,phi],AllPermutations);
		addVertexes([phi-1,phi-1,phi-1,phi*phi],AllPermutations);

		addVertexes([0,(phi-1)*(phi-1),1,phi*phi],EvenPermutations);
		addVertexes([0,phi-1,phi,Math.sqrt(5)],EvenPermutations);
		addVertexes([phi-1,1,phi,2],EvenPermutations);

		addEdges(1.5);
	}
	if(type == "120cellv2") {
		ptope.rotate(0,2,Math.PI/5);
	}
	if(type == "24cell") {
		addVertexes([1,1,0,0], AllPermutations);
		addEdges(3);
	}
	if(type == "tesseract") {
		addVertexes([1,1,1,1], IdPermutation);
		addEdges(5);
	}
	if(type == "16cell") {
		addVertexes([1,0,0,0], EvenPermutations);
		addEdges(3);
		ptope.rotate(0,3,Math.PI/4);
		ptope.rotate(1,3,Math.PI/4);
		ptope.rotate(2,3,Math.PI/4);
	}
	if(type == "icosahedron") {
		addVertexes([phi,1,0,0], Even3Permutations);
		addEdges(5);
	}
	if(type == "dodecahedron") {
		addVertexes([1,1,1,0], IdPermutation);
		addVertexes([phi,1-phi,0,0], Even3Permutations);
		addEdges(3);
	}
	if(type == "cube") {
		addVertexes([1,1,1,0], IdPermutation);
		addEdges(5);
	}
	if(type == "octahedron") {
		addVertexes([1,0,0,0], Even3Permutations);
		addEdges(3);
	}
	if(type == "pentachoron" || type == "5cell") {
		vs.push([1,1,1,-1]);
		vs.push([1,-1,-1,-1]);
		vs.push([-1,1,-1,-1]);
		vs.push([-1,-1,1,-1]);
		vs.push([0,0,0,2/phi]);
		addEdges(40);
	}
	if(type == "truncatedOctahedron") {
		addVertexes([2,1,0,0], All3Permutations);
		addEdges(3);
	}
	if(type == "icosidodecahedron") {
		addVertexes([phi,0,0,0], Even3Permutations);
		addVertexes([0.5, phi/2, (1+phi)/2,0], Even3Permutations);
		addEdges(2);
	}

	ptope.normalize();

	if(rotatedim0 && rotatedim1)
		ptope.rotate(0,1,Math.random()*2*Math.PI);
	if(rotatedim0 && rotatedim2)
		ptope.rotate(0,2,Math.random()*2*Math.PI);
	if(rotatedim1 && rotatedim2)
		ptope.rotate(1,2,Math.random()*2*Math.PI);
	if(rotatedim0 && rotatedim3)
		ptope.rotate(0,3,Math.random()*2*Math.PI);
	if(rotatedim1 && rotatedim3)
		ptope.rotate(1,3,Math.random()*2*Math.PI);
	if(rotatedim2 && rotatedim3)
		ptope.rotate(2,3,Math.random()*2*Math.PI);
} // End setPolytope.

setPolytope(document.body.getElementsByTagName('script')[0].classList[0]);
setInterval(draw, 20);


window.addEventListener("resize", setDimensions);
window.addEventListener("scroll", setDimensions);

var width, height, scale;
function setDimensions() {
	width = c.offsetWidth;
	height = c.offsetHeight;
	scale = Math.min(width, height)/2;
	draw();
}
setDimensions();