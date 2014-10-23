(function(){
  var Unit = function(x, y, color, ctx, width){
    this.draw = ctx.fillRect;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.color = color;
    this.width = width;
  }
  Unit.prototype.step = function(grid){
    var live = 0;
    var dead = 0;
    var neighbors = [grid[this.x][this.y-1], grid[this.x][this.y+1], grid[this.y][this.x+1], grid[this.y][this.x-1]];
    if(this.x-1 >= 0){
      var xminus = grid[this.x-1];
    }
    if(this.x+1 <= grid.length){
      var xplus = grid[this.x+1];
    }
    if(this.y-1 >= 0){
      if(xplus){neighbors.push(xplus[this.y-1])};
      if(xminus){neighbors.push(xminus[this.y-1])};
    }
    if(this.y+1 <= grid.length){
      if(xplus){neighbors.push(xplus[this.y+1])};
      if(xminus){neighbors.push(xminus[this.y+1])};
    }
    _.each(neighbors, function(el){
      if(el){
        if(el.color == 'black'){
          live += 1;
        }else{
          dead += 1;
        }
      }
    })
    var changed = false;
    if(live < 2){
      this.color = 'white';
      changed = true;
    }else if(this.color == 'white' && live == 3){
      this.color = 'black';
      changed = true;
    }else if(this.color == 'black' && live > 3){
      this.color = 'white';
      changed = true;
    }
    if(!changed){
      return false
    }else{
      if(this.color == 'white'){
        this.ctx.fillStyle = 'white';
      }else{
        this.ctx.fillStyle = 'black';
      }
      this.ctx.fillRect(this.x*this.width, this.y*this.width, this.width, this.width)
      return true
    }
  }
  var MainEngine = function(elId, threshold, interval, width){
    this.canvas = document.getElementById(elId);
    this.ctx = this.canvas.getContext('2d');
    this.history = [];
    this.grid = [];
    this.threshold = threshold;
    this.interval = interval;
    this.cachedTimeout;
    this.steps = 0;
    this.width = width;
    (function(that){
      _.each(_.range(100), function(el){
        that.grid[el] = [];
        _.each(_.range(100), function(el1){
          var rand = Math.random();
          var color = 'white';
          if(rand > that.threshold){
            color = 'black';
          }
          var unit = new Unit(el, el1, color, that.ctx, that.width);
          that.grid[el].push(unit);
        })
      })
    })(this)
    this.history.push(_.cloneDeep(this.grid));
    console.log(this.grid);
  }
  MainEngine.prototype.step = function(){
    // Each unit makes decision based on previous step.
    // Simulates simultaneous decision making.
    var changed = false;
    (function(that){
      _.each(that.grid, function(el){
        _.each(el, function(unit){
          if(!changed){
            changed = unit.step(that.history[that.history.length-1]);
          }else{
            unit.step(that.history[that.history.length-1]);
          }
        })
      })
    })(this)
    // This cloneDeep is used to maintain history of steps, but causes big performance issues.
    this.history.push(_.cloneDeep(this.grid));
    this.steps += 1;
    if(!changed){
      clearTimeout(this.cachedTimeout);
      console.log('converged in ', this.steps, 'steps')
    }
  }

  $(function(){
    // engine constructor accepts (canvasID, randomAliveThreshold, stepTimeInterval in ms, blockWidth)
    var engine = new MainEngine('mainCanvas', .5, 100, 6);
    var go = function(){
      engine.step();
      if(engine.cachedTimeout){
        clearTimeout(engine.cachedTimeout);
      }
      engine.cachedTimeout = setTimeout(go, engine.interval)
    }
    go()
    // requestAnimationFrame(function(){
    //   console.log('rendering')
    //   engine.step();
    //   engine.render();
    // })
    console.log('loaded')
  })
})()