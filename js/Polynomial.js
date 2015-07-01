Polynomial = function(controlPoints, isSpline, degree, domain, isClose, numPoints) {
    this.control    = new Array();
    this.drawPoints = new Array();
    this.knot       = new Array();
    this.xValue     = new Array();

    for(i = 0; i < controlPoints.length; i++)
        this.control.push([controlPoints[i][0], controlPoints[i][1]]);
    if(isClose) {
        for(i = 0; i <= degree; i++)
            this.control.push([controlPoints[i][0], controlPoints[i][1]]);
    }

    var knotSize = this.control.length + degree + 1;
    var delta    = (domain[1] - domain[0])/knotSize;
    var t_i      = domain[0];
    for(i = 0; i < knotSize; i++) {
        this.knot.push(t_i);
        t_i += delta;
    }

    var x     = this.knot[degree];
    var delta = (this.knot[this.control.length] - x)/200;
    for(i = 0; i < numPoints; i++) {
        this.xValue.push(x);
        x  += delta;
    }

    if(isSpline)
        this.Bspline(degree);
    else
        this.RaGs(degree);
};

Polynomial.prototype = {
    Bspline: function(degree) {
        var p;

        for(i = 0; i < this.xValue.length; i++) {
            p = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                var N = this.coxDeBoor(degree, j, this.xValue[i]);
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
};
