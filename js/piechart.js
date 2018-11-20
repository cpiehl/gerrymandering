// https://code.tutsplus.com/tutorials/how-to-draw-a-pie-chart-and-doughnut-chart-using-javascript-and-html5-canvas--cms-27197


function drawArc(ctx, centerX, centerY, radius, startAngle, endAngle)
{
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, startAngle, endAngle);
	ctx.stroke();
}

function drawPieSlice(ctx,centerX, centerY, radius, startAngle, endAngle, color ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX,centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}

var Piechart = function(options) {
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");

    this.draw = function() {
		var total_value = 0;
		for (var key in this.options.data) {
			total_value += this.options.data[key].count;
		}

        var start_angle = 0;
		for (var key in this.options.data) {
			var val = this.options.data[key];
            var slice_angle = 2 * Math.PI * val.count / total_value;

            drawPieSlice(
                this.ctx,
                this.canvas.width/2,
                this.canvas.height/2,
                Math.min(this.canvas.width/2,this.canvas.height/2),
                start_angle,
                start_angle+slice_angle,
				val.color
            );

            start_angle += slice_angle;
        }

        //drawing a white circle over the chart
        //to create the doughnut chart
        if (this.options.doughnutHoleSize){
            var color = "#FFFFFF";
            if (typeof this.options.doughnutHoleColor !== 'undefined')
              color = this.options.doughnutHoleColor;
            drawPieSlice(
                this.ctx,
                this.canvas.width/2,
                this.canvas.height/2,
                this.options.doughnutHoleSize * Math.min(this.canvas.width/2,this.canvas.height/2),
                0,
                2 * Math.PI,
                color
            );
        }

        // start_angle = 0;
        // for (categ in this.options.data){
        //     val = this.options.data[categ];
        //     slice_angle = 2 * Math.PI * val / total_value;
        //     var pieRadius = Math.min(this.canvas.width/2,this.canvas.height/2);
        //     var labelX = this.canvas.width/2 + (pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
        //     var labelY = this.canvas.height/2 + (pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
		// 	// var labelX = this.canvas.width/2;
		// 	// var labelY = this.canvas.height/2;
		//
        //     if (this.options.doughnutHoleSize){
        //         var offset = (pieRadius * this.options.doughnutHoleSize ) / 4;
        //         labelX = this.canvas.width/2 + (offset + pieRadius / 2) * Math.cos(start_angle + slice_angle/2);
        //         labelY = this.canvas.height/2 + (offset + pieRadius / 2) * Math.sin(start_angle + slice_angle/2);
        //     }
		//
        //     var labelText = Math.round(100 * val / total_value);
        //     this.ctx.fillStyle = "white";
        //     this.ctx.font = "bold 20px Arial";
        //     this.ctx.fillText(labelText+"%", labelX,labelY);
        //     start_angle += slice_angle;
        // }
    }
}

