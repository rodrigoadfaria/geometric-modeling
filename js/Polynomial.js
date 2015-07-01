Polynomial = function(controlPoints, isSpline, degree, domain, isClose, numPoints) {
    this.isClose    = isClose
    this.degree     = degree;
    this.control    = new Array();
    this.drawPoints = new Array();
    this.knot       = new Array();
    this.xValue     = new Array();

    for(i = 0; i < controlPoints.length; i++)
        this.control.push([controlPoints[i][0], controlPoints[i][1]]);
    if(this.isClose) {
        for(i = 0; i <= this.degree; i++)
            this.control.push([controlPoints[i][0], controlPoints[i][1]]);
    }

    var knotSize = this.control.length + this.degree + 1;
    var delta    = (domain[1] - domain[0])/knotSize;
    var t_i      = domain[0];
    for(i = 0; i < knotSize; i++) {
        this.knot.push(t_i);
        t_i += delta;
    }

    var x     = this.knot[this.degree];
    var delta = (this.knot[this.control.length] - x)/200;
    for(i = 0; i < numPoints; i++) {
        this.xValue.push(x);
        x  += delta;
    }

    if(isSpline)
        this.Bspline();
    else
        this.RaGs();
};

Polynomial.prototype = {
    Bspline: function() {
        var p;

        for(i = 0; i < this.xValue.length; i++) {
            p = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                var N = this.coxDeBoor(this.degree, j, this.xValue[i]);
                p[0] += this.control[j][0] * N;
                p[1] += this.control[j][1] * N;
            }
            this.drawPoints.push(vec4(p[0], p[1], 100, 1));
        }
    },

    coxDeBoor: function(degree, i, x) {
        if(x == this.knot[0] || x == this.knot[this.knot.length - 1])
            return 1;
        if(degree == 0) {
            if(this.knot[i] <= x && x < this.knot[i + 1])
                return 1;
            else
                return 0;
        }

        var r = (x - this.knot[i])/(this.knot[i + degree] - this.knot[i]);
        var q = (this.knot[i + degree + 1] - x)/(this.knot[i + degree + 1] - this.knot[i + 1]);

        return (r * this.coxDeBoor(degree - 1, i, x) + q * this.coxDeBoor(degree - 1, i + 1, x)); 
    },

    binarrySearch: function(t, isFloor) {
        var lo = 0;
        var hi = this.xValue.length - 1;

        while(lo <= hi) { 
            var m   = lo + (hi - lo) / 2; 

            if     (t < this.xValue[m]) hi = m - 1; 
            else if(t > this.xValue[m]) lo = m + 1; 
            else return m;
        } 
        if(isFloor)
            return hi;
        return lo;
    },
};
