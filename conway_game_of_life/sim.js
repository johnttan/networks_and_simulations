(function(){
  var Unit = function(x, y, color, ctx, width){
    this.draw = ctx.fillRect;
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.color = color;
    this.width = width;
  }
  var UnitStep = function(grid){
    var live = 0;
    var dead = 0;
    var neighbors = [];
    if(this.x-1 >= 0){
      var xminus = grid[this.x-1];
      neighbors.push(xminus[this.y]);
    }
    if(this.x+1 < grid.length){
      var xplus = grid[this.x+1];
      neighbors.push(xplus[this.y])
    }
    if(this.y-1 >= 0){
      neighbors.push(grid[this.x][this.y-1]);
      if(xplus){neighbors.push(xplus[this.y-1])};
      if(xminus){neighbors.push(xminus[this.y-1])};
    }
    if(this.y+1 < grid.length){
      neighbors.push(grid[this.x][this.y+1])
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
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x*this.width, this.y*this.width, this.width, this.width)
      return true
    }
  }
  Unit.prototype.step = UnitStep;
  Unit.prototype.render = function(){
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(this.x*this.width, this.y*this.width, this.width, this.width)
  }
  var MainEngine = function(elId, threshold, interval, width, coords){
    this.canvas = document.getElementById(elId);
    this.ctx = this.canvas.getContext('2d');
    this.history = [];
    this.grid = [];
    this.threshold = threshold;
    this.interval = interval;
    this.cachedTimeout;
    this.steps = 0;
    this.width = width;
    this.init = function(){
      this.steps = 0;
      this.history = [];
      (function(that){
        _.each(_.range(100), function(el){
          that.grid[el] = [];
          _.each(_.range(100), function(el1){
            var unit = new Unit(el, el1, 'white', that.ctx, that.width);
            that.grid[el].push(unit);
          })
        })
      })(this)
    }
    this.init();
    this.initCoords = function(coords){
      this.init();
      (function(that){
        _.each(coords, function(pair){
          that.grid[pair[0]][pair[1]].color = 'black';
        })
      })(this)  
      this.history.push(_.cloneDeep(this.grid));

    }
    this.randomCoords = function(){
      this.init();
      (function(that){
        _.each(_.range(100), function(el){
          _.each(_.range(100), function(el1){
            var rand = Math.random();
            var color = 'white';
            if(rand > that.threshold){
              color = 'black';
            }
            that.grid[el][el1].color = color;
          })
        })
      })(this)  
      this.history.push(_.cloneDeep(this.grid));    
    }
    if(coords){
      this.initCoords(coords);
    }else{
      this.randomCoords();
    }
    (function(that){
      _.each(that.grid, function(el){
        _.each(el, function(el1){
          el1.render();
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
    var current;
    if(this.steps == this.history.length){
      current = this.grid;
    }else{
      current = this.history[this.steps-1]
    }
    (function(that){
      _.each(current, function(el){
        _.each(el, function(unit){
          if(!changed){
            changed = UnitStep.call(unit, that.history[that.steps - 1]);
          }else{
            UnitStep.call(unit, that.history[that.steps-1]);
          }
        })
      })
    })(this)
    // This cloneDeep is used to maintain history of steps, but causes big performance issues.
    // A more efficient implementation would be to record the delta per unit per step.
    if(this.steps == this.history.length){
      this.history.push(_.cloneDeep(this.grid));
    }
    this.steps += 1;
    // Convergence detection bugged. Does not detect stable or equilibirum states.
    if(!changed){
      clearTimeout(this.cachedTimeout);
      console.log('converged in ', this.steps, 'steps')
    }
  }

  $(function(){
    var coords = false;
    // engine constructor accepts (canvasID, randomAliveThreshold, stepTimeInterval in ms, blockWidth)
    // var coords = [[20, 20], [20, 21], [20, 22], [20, 23], [20, 24]]
    // var coords = [[10, 10], [10, 11], [11, 10], [11, 11]]
    var coords = [
    [24, 8],
    [22, 7], [24, 7],
    [12, 6], [13, 6], [20, 6], [21, 6], [34, 6], [35, 6],
    [11, 5], [15, 5], [20, 5], [21, 5], [34, 5], [35, 5],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 3], [1, 3], [10, 3], [14, 3], [16, 3], [17, 3], [22, 3], [24, 3],
    [10, 2], [16, 2], [24, 2],
    [11, 1], [15, 1],
    [12, 0], [13, 0]
]
    _.each(coords, function(pair){
      pair[0] += 10;
      pair[1] += 10;
    })
    var engine = new MainEngine('mainCanvas', .9, 100, 6, coords);
    var go = function(){
      engine.steps = engine.history.length;
      if(engine.cachedTimeout){
        clearTimeout(engine.cachedTimeout);
      }
      engine.step();
      engine.cachedTimeout = setTimeout(go, engine.interval)
    }
    $('#go').click(go)
    $('#stop').click(function(){
      clearTimeout(engine.cachedTimeout);
    })
    $('#glider').click(function(){
      clearTimeout(engine.cachedTimeout);
      engine.initCoords(coords);
    })
    $('#random').click(function(){
      clearTimeout(engine.cachedTimeout);
      engine.randomCoords();
    })
    $('#back').click(function(){
      if(engine.steps > 1){
        clearTimeout(engine.cachedTimeout);
        console.log(engine.steps, "step")
        engine.steps -= 2;
        engine.step()
      }
    })
    // requestAnimationFrame(function(){
    //   console.log('rendering')
    //   engine.step();
    //   engine.render();
    // })
    console.log('loaded')
  })
})()