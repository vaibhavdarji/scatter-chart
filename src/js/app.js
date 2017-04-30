


var BootStrapApp = function ($el) {
    if (!($el instanceof $)) {
		$el = $($el);
	}

	//bind the events
	//$el.on('click', this.onQuickTipClick.bind(this));

	this.$el = $el;
	this.el = $el[0];
};

BootStrapApp.prototype = {
    /**
    * @property {jQuery} $el
    */
    $el: null,

    /**
    * [el description]
    * @property {HTMLElement} el
    */
    el: null,
    width: 960,
    size: 250,
    padding: 15,
    xAxis: null,
    yAxis: null,
    xScale: null,
    yScale: null,
    brushCell: null,
    crossDraw: function (setOne, setTwo) {
        var list = [],
            n = setOne.length, m = setTwo.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) list.push({x: setOne[i], i: i, y: setTwo[j], j: j});
        return list;
    },

    plot: function (p, elem) {

        var cell = d3.select(elem),
            self = this;

        self.xScale.domain(self.dataSet[p.x]);
        self.yScale.domain(self.dataSet[p.y]);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", self.padding / 2)
            .attr("y",self.padding / 2)
            .attr("width", self.size - self.padding)
            .attr("height", self.size - self.padding);

        cell.selectAll("circle")
            .data(self.data)
            .enter().append("circle")
            .attr("cx", function(d) { return self.xScale(d[p.x]); })
            .attr("cy", function(d) { return self.yScale(d[p.y]); })
            .attr("r", 4)
            .attr('species', function (d) {
                return d.species;
            })
            .style("fill", function(d) { return self.randomColor(d.species); });
    },

    onSuccess: function (response) {

        var self = this,
            dataSet = {},
            dataList = d3.keys(response[0]).filter(function(d) { return d !== "species"; }),
            fieldLength = dataList.length;

        dataList.forEach(function(item) {
            dataSet[item] = d3.extent(response, function(d) { return d[item]; });
        });

        var xScale = d3.scale.linear().range([this.padding / 2, this.size - this.padding / 2]),
            yScale = d3.scale.linear().range([this.size - this.padding / 2, this.padding / 2]),
            xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6),
            yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(6),
            randomColor = d3.scale.category10();

        xAxis.tickSize(this.size * fieldLength);
        yAxis.tickSize(-this.size * fieldLength);


        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.dataSet = dataSet;
        this.xScale = xScale;
        this.yScale = yScale;
        this.data = response;
        this.randomColor = randomColor;


        var brush = d3.svg.brush()
            .x(self.xScale)
            .y(self.yScale)
            .on("brushstart", brushStart)
            .on("brush", brushMove)
            .on("brushend", brushEnd);


        var scatterSvgChart = d3.select(this.el).append("svg")
            .attr("width", self.size * fieldLength + self.padding)
            .attr("height", self.size * fieldLength + self.padding)
            .append("g")
            .attr("transform", "translate(" + self.padding + "," + self.padding * 4 + ")");

        scatterSvgChart.selectAll(".x.axis")
            .data(dataList)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) { return "translate(" + (fieldLength - i - 1) * self.size + ",0)"; })
            .each(function(d) {
                xScale.domain(dataSet[d]);
                d3.select(this).call(xAxis);
            });

      scatterSvgChart.selectAll(".y.axis")
          .data(dataList)
          .enter().append("g")
          .attr("class", "y axis")
          .attr("transform", function(d, i) { return "translate(0," + i * self.size + ")"; })
          .each(function(d) { yScale.domain(dataSet[d]); d3.select(this).call(yAxis); });


      var itemCell = scatterSvgChart.selectAll(".cell")
          .data(self.crossDraw(dataList, dataList))
          .enter()
          .append("g")
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + (fieldLength - d.i - 1) * self.size + "," + d.j * self.size + ")"; })
          .each(function (p) {
              self.plot(p, this);
          });

      itemCell.filter(function(d) { return d.i === d.j; })
        .append("text")
        .attr("x", self.padding)
        .attr("y", self.padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

      itemCell.call(brush);

      var legend = scatterSvgChart.selectAll(".legend")
        .data(randomColor.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            var ypos = (i === 0) ? -10 : (i * -30);
            return "translate(0, " + ypos  + ")";
        });


        legend.append("rect")
            .attr("x", self.width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) { return self.randomColor(d); })


        legend.append("text")
            .attr("x", self.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

        legend.on('click', function (e) {
            var isHidden = scatterSvgChart.selectAll("circle[species="+ e + "]").classed("hidden"),
                opacity = isHidden ? 1: 0;

            scatterSvgChart.selectAll("circle[species="+ e + "]")
                .classed("hidden", !isHidden)
                .style('opacity', opacity);
                d3.select(this).style('opacity', isHidden ? '1': '0.5');
        });

        var brushCell;


        function brushStart(p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.clear());
              self.xScale.domain(self.dataSet[p.x]);
              self.yScale.domain(self.dataSet[p.y]);
              brushCell = this;
            }
        }

        // Highlight the selected circles.
        function brushMove(p) {
            var e = brush.extent();
            scatterSvgChart.selectAll("circle").classed("hidden", function(d) {
                return e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1];
            });
        }

        // If the brush is empty, select all circles.
        function brushEnd() {
            if (brush.empty()) scatterSvgChart.selectAll(".hidden").classed("hidden", false);
        }
    },
    onError: function (error) {
        console.warn('error while reading data', error);
    },

    onLoadData: function (error, data) {
        if (error) {
            return this.onError(error);
        }
        this.onSuccess(data.result);
    },

    loadScatterChart: function () {
        return d3.json('data/data.json', $.proxy(this.onLoadData, this));
    }
};


BootStrapApp.init = function ($container) {
    if (!($container instanceof $)) {
        $container = $($container);
    }
    return new BootStrapApp($container);
}



$(document).ready(function () {
    var scatterChart = BootStrapApp.init($('.container'));
    scatterChart.loadScatterChart();
})
