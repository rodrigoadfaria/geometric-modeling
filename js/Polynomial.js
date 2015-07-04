Polynomial = function(controlPoints, isSpline, degree, isClose, numPoints, sigma) {
    this.isClose     = isClose
    this.degree      = degree;
    this.sigma       = sigma;
    this.control     = new Array();
    this.controlDel  = new Array();
    this.drawPoints  = new Array();
    this.drawNormals = new Array();
    this.knot        = new Array();
    this.domain      = new Array();

    if(isSpline) {
        for(i = 0; i < controlPoints.length; i++)
            this.control.push([controlPoints[i][0], controlPoints[i][1]]);
        if(this.isClose) {
            for(i = 0; i <= this.degree; i++)
                this.control.push([controlPoints[i][0], controlPoints[i][1]]);
        }

        var knotSize = this.control.length + this.degree + 1;
        var delta    = 1/knotSize;
        var t_i      = 0;
        for(i = 0; i < knotSize; i++) {
            this.knot.push(t_i);
            t_i += delta;
        }
        
        for(i = 0; i < this.control.length - 1; i++) {
            var r = this.degree/(this.knot[i + this.degree + 1] - this.knot[i + 1]);
            this.controlDel.push([r * this.control[i + 1][0], r * this.control[i][1]]);
        }
    
        var x     = this.knot[this.degree];
        var delta = (this.knot[this.control.length] - x)/numPoints;
        for(i = 0; i < numPoints; i++) {
            this.domain.push(x);
            x  += delta;
        }
        this.Bspline();
        this.BsplineNormals()
    }
    else {
        for(i = 0; i < controlPoints.length; i++)
            this.control.push(vec2(controlPoints[i][0], controlPoints[i][1]));

        var t_i = 0;
        var delta = 1/this.control.length;
        for(j = 0; j <= this.control.length; j++) {
            this.knot.push(t_i);
            t_i += delta;
        }

        var x     = 0;
        var delta = 1/numPoints;
        for(i = 0; i <= numPoints; i++) {
            this.domain.push(x);
            x  += delta;
        }
        if(isClose) {
            this.RaGsClose();
            this.RaGsNormals()
        }
        else {
            this.RaGs();
            this.RaGsNormals()
        }
    }
};

Polynomial.prototype = {
    Bspline: function() {
        var p;

        for(i = 0; i < this.domain.length; i++) {
            p = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                var N = this.coxDeBoor(this.degree, j, this.domain[i]);
                p[0] += this.control[j][0] * N;
                p[1] += this.control[j][1] * N;
            }
            this.drawPoints.push(vec4(p[0], p[1], 100, 1));
        }
    },

    BsplineNormals: function() {
        var n;

        for(i = 0; i < this.domain.length; i++) {
            n = [0, 0];
            for(j = 0; j < this.controlDel.length; j++) {
                var N = this.coxDeBoor(this.degree - 1, j, this.domain[i]);
                n[0] += this.controlDel[j][0] * N;
                n[1] += this.controlDel[j][1] * N;
            }
            this.drawNormals.push(vec4(-n[1], n[0], 100, 0));
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
  
    RaGs: function() {
        var gauss;
        var q        = [0, 0];
        var sumGauss = 0;
        var sum      = 0;

        for(i = 0; i < this.domain.length; i++) {
            q = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                sumGauss = 0;
                gauss = Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j]), 2)/(2 * Math.pow(this.sigma, 2)));
                for(k = 0; k < this.control.length; k++)
                    sumGauss += Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k]), 2)/(2 * Math.pow(this.sigma, 2)));
                if(sumGauss != 0)
                    var G = gauss/sumGauss;
                else
                    var G = 0;
                q[0] += this.control[j][0] * G;
                q[1] += this.control[j][1] * G;
            }
            this.drawPoints.push(vec4(q[0], q[1], 100, 1));
        }
    },

    RaGsClose: function() {
        var q;
        var sumGauss = 0;
        var gauss    = 0;
        var aux      = 0;
        var limit    = Math.ceil(this.sigma * 6.1);

        for(i = 0; i < this.domain.length; i++) {
            q = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                gauss = 0;
                sumGauss = 0;
                for(l = -limit; l <= limit; l++)
                    gauss += Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j] - l), 2)/(2 * Math.pow(this.sigma, 2)));
                for(k = 0; k < this.control.length; k++) {
                    aux = 0;
                    for(l = -limit; l <= limit; l++)
                        aux += Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k] - l), 2)/(2 * Math.pow(this.sigma, 2)));
                    sumGauss += aux;
                }
                if(sumGauss != 0)
                    var G = gauss/sumGauss;
                else
                    var G = 0;
                q[0] += this.control[j][0] * G;
                q[1] += this.control[j][1] * G;
            }
            this.drawPoints.push(vec4(q[0], q[1], 100, 1));
        }
    },

    RaGsNormals: function() { 
        var gauss;
        var n        = [0, 0];
        var sumGauss = 0;
        var sum      = 0;

        for(i = 0; i < this.domain.length; i++) {
            n = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                sumGauss = 0;
                gauss  = Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j]), 2)/(2 * Math.pow(this.sigma, 2)));
                gauss *= (this.domain[i] - this.knot[j])/Math.pow(this.sigma, 2);
                for(k = 0; k < this.control.length; k++)
                    sumGauss += Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k]), 2)/(2 * Math.pow(this.sigma, 2)));
                if(sumGauss != 0)
                    var G = gauss/sumGauss;
                else
                    var G = 0;
                n[0] += this.control[j][0] * G;
                n[1] += this.control[j][1] * G;
                
                sumGauss = 0;
                gauss  = Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j]), 2)/(2 * Math.pow(this.sigma, 2)));
                gauss *=Math.pow(this.sigma, 4);
                for(k = 0; k < this.control.length; k++)
                    sumGauss += (this.domain[i] - this.knot[k]) * 
                                Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k]), 2)/(2 * Math.pow(this.sigma, 2)));
                if(sumGauss != 0)
                    var G = gauss/Math.pow(sumGauss, 2);
                else
                    var G = 0;
                n[0] += this.control[j][0] * G;
                n[1] += this.control[j][1] * G;
            }
            this.drawNormals.push(vec4(-n[1], n[0], 100, 0));
        }
    },
   

    // Em construcao
    RaGsNormalsClose: function() { 
        var n        = [0, 0];
        var sumGauss = 0;
        var gauss    = 0;
        var aux      = 0;
        var limit    = Math.ceil(this.sigma * 6.1);

        for(i = 0; i < this.domain.length; i++) {
            n = [0, 0];
            for(j = 0; j < this.control.length; j++) {
                gauss    = 0;
                sumGauss = 0;
                for(l = -limit; l <= limit; l++)
                    gauss += (this.domain[i] - this.knot[j] - l)/Math.pow(this.sigma, 2) * Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j] - l), 2)/(2 * Math.pow(this.sigma, 2)));
                for(k = 0; k < this.control.length; k++) {
                    aux = 0;
                    for(l = -limit; l <= limit; l++)
                        aux += Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k]), 2)/(2 * Math.pow(this.sigma, 2)));
                    sumGauss += aux;
                }
                if(sumGauss != 0)
                    var G = gauss/sumGauss;
                else
                    var G = 0;
                n[0] += this.control[j][0] * G;
                n[1] += this.control[j][1] * G;
                
                gauss    = 0;
                sumGauss = 0;
                for(l = -limit; l <= limit; l++)
                    gauss += Math.pow(this.sigma, 4) * Math.exp(-1 * Math.pow((this.domain[i] - this.knot[j] - l), 2)/(2 * Math.pow(this.sigma, 2)));
                for(k = 0; k < this.control.length; k++)
                    sumGauss += (this.domain[i] - this.knot[k]) * 
                                Math.exp(-1 * Math.pow((this.domain[i] - this.knot[k]), 2)/(2 * Math.pow(this.sigma, 2)));
                if(sumGauss != 0)
                    var G = gauss/Math.pow(sumGauss, 2);
                else
                    var G = 0;
                n[0] += this.control[j][0] * G;
                n[1] += this.control[j][1] * G;
            }
            this.drawNormals.push(vec4(-n[1], n[0], 100, 0));
        }
    },
};
