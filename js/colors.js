const RLUM = 0.3086;
const GLUM = 0.6094;
const BLUM = 0.0820;
const ident = identmat();

function identmat() {
	return [
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0 ,1]
	];
}

function saturatemat(mat, sat)
{
    var mmat = [];
    var a, b, c, d, e, f, g, h, i;
    var rwgt, gwgt, bwgt;

    rwgt = RLUM;
    gwgt = GLUM;
    bwgt = BLUM;

    a = (1.0-sat)*rwgt + sat;
    b = (1.0-sat)*rwgt;
    c = (1.0-sat)*rwgt;
    d = (1.0-sat)*gwgt;
    e = (1.0-sat)*gwgt + sat;
    f = (1.0-sat)*gwgt;
    g = (1.0-sat)*bwgt;
    h = (1.0-sat)*bwgt;
	i = (1.0-sat)*bwgt + sat;
	mmat[0] = [];
    mmat[0][0] = a;
    mmat[0][1] = b;
    mmat[0][2] = c;
    mmat[0][3] = 0.0;

	mmat[1] = [];
    mmat[1][0] = d;
    mmat[1][1] = e;
    mmat[1][2] = f;
    mmat[1][3] = 0.0;

	mmat[2] = [];
    mmat[2][0] = g;
    mmat[2][1] = h;
    mmat[2][2] = i;
    mmat[2][3] = 0.0;

	mmat[3] = [];
    mmat[3][0] = 0.0;
    mmat[3][1] = 0.0;
    mmat[3][2] = 0.0;
	mmat[3][3] = 1.0;
	
    return matrixmult(mmat, mat);
}

function matrixmult(a, b) {
    var x, y;
    var temp = [];

    for(y=0; y<4 ; y++) {
		temp[y] = [];
        for(x=0 ; x<4 ; x++) {
            temp[y][x] = b[y][0] * a[0][x]
                       + b[y][1] * a[1][x]
                       + b[y][2] * a[2][x]
                       + b[y][3] * a[3][x];
		}
	}
	return temp;
}