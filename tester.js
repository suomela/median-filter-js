
function gen_data(n) {
    var r = []
    r.length = n
    var max = (1 << 30) * 4
    for (var i = 0; i < n; ++i) {
        r[i] = Math.floor(Math.random() * max)
    }
    return r
}

function compare_pair(a, b) {
    return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0]
}

function Block(h) {
    this.h = h
    this.k = 2 * h + 1
    this.prev = []
    this.next = []
    this.prev.length = this.k + 1
    this.next.length = this.k + 1
    this.pairs = []
    this.pairs.length = this.k

    this.init = function(x, base) {
        this.x = x
        this.base = base
        for (var i = 0; i < this.k; ++i) {
            this.pairs[i] = [x[base + i], i]
        }
        this.pairs.sort(compare_pair)
        var p = this.k
        for (var i = 0; i < this.k; ++i) {
            var q = this.pairs[i][1]
            this.next[p] = q
            this.prev[q] = p
            p = q
        }
        this.next[p] = this.k
        this.prev[this.k] = p
        this.m = this.pairs[this.h][1]
        this.s = this.h
    }

    this.unwind = function() {
        for (var i = this.k - 1; i >= 0; --i) {
            this.next[this.prev[i]] = this.next[i]
            this.prev[this.next[i]] = this.prev[i]
        }
        this.m = this.k
        this.s = 0
    }

    this.delete = function(i) {
        this.next[this.prev[i]] = this.next[i]
        this.prev[this.next[i]] = this.prev[i]
        if (this.is_small(i)) {
            --this.s
        } else {
            if (this.m == i) {
                this.m = this.next[this.m]
            }
            if (this.s > 0) {
                this.m = this.prev[this.m]
                --this.s
            }
        }
    }

    this.undelete = function(i) {
        this.next[this.prev[i]] = i
        this.prev[this.next[i]] = i
        if (this.is_small(i)) {
            this.m = this.prev[this.m]
        }
    }

    this.advance = function() {
        this.m = this.next[this.m]
        ++this.s
    }

    this.at_end = function() {
        return this.m == this.k
    }

    this.peek = function() {
        if (this.at_end()) {
            return Infinity
        } else {
            return this.x[this.base + this.m]
        }
    }

    this.get_pair = function(i) {
        return [this.x[this.base + i], i]
    }

    this.is_small = function(i) {
        return this.at_end() || compare_pair(this.get_pair(i), this.get_pair(this.m)) < 0
    }
}

function sort_median(h, b, x) {
    var k = 2 * h + 1
    var A = new Block(h)
    var B = new Block(h)
    B.init(x, 0)
    var y = []
    y.length = k * (b-1) + 1
    var yi = 0
    y[yi] = B.peek()
    ++yi
    for (var j = 1; j < b; ++j) {
        var tmp = A; A = B; B = tmp
        B.init(x, j*k)
        B.unwind()
        console.assert(A.s == h)
        console.assert(B.s == 0)
        for (var i = 0; i < k; ++i) {
            A.delete(i)
            B.undelete(i)
            console.assert(A.s + B.s <= h)
            if (A.s + B.s < h) {
                if (A.peek() <= B.peek()) {
                    A.advance()
                } else {
                    B.advance()
                }
            }
            console.assert(A.s + B.s == h)
            y[yi] = Math.min(A.peek(), B.peek())
            ++yi
        }
        console.assert(A.s == 0)
        console.assert(B.s == h)
    }
    return y
}

function verify(h, b) {
    var k = 2 * h + 1
    var n = k * b
    var x = gen_data(n)
    var y = sort_median(h, b, x)
    console.assert(y.length == n - k + 1)
    for (var i = 0; i < y.length; ++i) {
        var small = 0
        var eq = 0
        for (var j = 0; j < k; ++j) {
            if (y[i] < x[i + j]) {
                ++small
            } else if (y[i] == x[i + j]) {
                ++eq
            }
        }
        console.assert(small <= h)
        console.assert(small + eq >= h + 1)
    }
}

function tester(h, b) {
    for (var trial = 0; trial < 10; ++trial) {
        for (var hbexp = 4; hbexp < 8; ++hbexp) {
            for (var hexp = 0; hexp < hbexp; ++hexp) {
                var bexp = hbexp - hexp
                var h = Math.pow(10,hexp)
                var b = Math.pow(10,bexp)
                var k = 2 * h + 1
                var n = k * b
                var x = gen_data(n)
                var s = Date.now()
                var y = sort_median(h, b, x)
                var e = Date.now() - s
                console.log("sort-js\t" + h + "\t" + b + "\tr-large\t0\t" + (e / 1E3))
            }
        }
    }
}

// Sanity checks
verify(1000, 10)
verify(100, 100)
verify(10, 1000)
// Benchmark
tester()
