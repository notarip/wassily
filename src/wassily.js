/*
  In honor to Wassily Kandinski and his 
  love for the circles
  Author: Pablo Notari <notarip[at]gmail.com>
  License: TODO Should by Creative, but i don´t know yet.
*/


/*  
    TODO: Acomodar los estilos
    TODO: Que el svg se pueda guardar como png o copiar al portapapeles
    TODO: Que quede fijo el paginado de las tablas
    TODO: Arreglar el stored para minimizar los registros con error
	TODO: Definir la licencia
*/

/*
  Recive a json in each element contais a pair id, val
  and group by distincts val
*/
function draw(someData, groupField ,idTable, idSVG){

  nv.addGraph(function() {
    var width = 350,
        height = 350;

    someData = proxyData(someData);    
    var groupData  = GroupBy(someData, groupField);

    var chart = nv.models.pieChart()
        .x(function(d) { return d.group })
        .y(function(d) { return d.value })
        .color(d3.scale.category10().range())
        .width(width)
        .height(height)
        .showLabels(true)    //Display pie labels
        .labelType("percent")
        .showLegend(true);

    d3.select("#"+idSVG)
        .datum(groupData)
        .transition().duration(1200)
        .attr('width', width)
        .attr('height', height)
        .call(chart);


    drawHeader(someData, idTable);
    var filterData=[];
    
    $('#'+idTable).dynatable({
        dataset:{
         records:someData
        },
        inputs:{
          queryEvent: 'blur change keyup',
          paginate:true,
          processingText:'Loading <img src="/img/loading.gif"/>'
        }


    });
    var dynatable = $("#"+idTable).data('dynatable');
    dynatable.queries.functions['table'] = function(record, queryValue) {
      return record.table == queryValue;
    };

    dynatable.queries.functions['graph'] = function(record, queryValue) {
      return record.graph == queryValue;
    };


    //trigger cuando se filtra por el grafico
    chart.dispatch.on('stateChange', function(e) { 
      stampGraphStatus(someData, d3.select("#"+idSVG).datum(),groupField);
      dynatable.settings.dataset.originalRecords = someData;
      dynatable.queries.add('table',true);
      dynatable.queries.add('graph',true);
      dynatable.process();
        
    });


    //Trigger cuando se filtra por la tabla
    $("#dynatable-query-search-"+idTable).bind("paste keyup", function(){
      dynatable.queries.remove('table',true);
      dynatable.queries.add('graph',true);
      dynatable.process();
      stampTableStatus(someData, idTable);
      var group =  GroupBy(recoverRecords(someData, true), groupField);
      d3.select("#"+idSVG).datum(group).call(chart);
      
    });

});

}

function recoverRecords(someData, value){

  var response = [];
  someData.forEach(function(obj){
    if (obj.table == value)
      response.push(obj);
  });

  return response;
}

function stampGraphStatus(proxyData, graphData, filterColumn){


  proxyData.forEach(function(obj){
   
    for(var k in  graphData) {
      if (obj[filterColumn] == graphData[k].group){
          if((graphData[k].disabled && graphData[k].disabled == true)){
           obj["graph"] = false;
           break;
          }else{
            obj["graph"] = true;
            break;
          }
      }
    } 

  });

  }

  function stampTableStatus(proxyData, idTable){


    var tableRecords =   recoverTableRecords(idTable);

    proxyData.forEach(function(obj){ 

      for(var k in  tableRecords){

        if (tableRecords[k].pkey == obj.pkey){
            obj.table = true;
            break;
        }else{
            obj.table = false;
        }
      }
    });

  }

function recoverTableRecords(idTable){

  var dynatable = $("#"+idTable).data('dynatable');
  dynatable.process();


  dynatable.paginationPerPage.set(dynatable.settings.dataset.queryRecordCount);
  dynatable.process();

  var records = dynatable.settings.dataset.records;

  dynatable.paginationPerPage.set(10);
  dynatable.process();

  return records;
  
}

function isAble(someValue, groupData){

  for(var k in  groupData) {

    if (groupData[k].group == someValue){

      if((groupData[k].disabled && groupData[k].disabled == true))
        return false;
      else
        return true;
    }
  }
}

function proxyData(someData){

 var i = 1;
  someData.forEach(function(obj){

      obj.pkey  = i++;
      obj.table = true;
      obj.graph = true;

  });

  return someData;

}

/*
  retorna un json array con group, value
*/
function GroupBy(myjson,attr){
  var sum ={};
  var i = 0;

  myjson.forEach( function(obj){
    if ( typeof sum[obj[attr]] == 'undefined') {
       
      sum[obj[attr]] = {
        group: obj[attr],
        value: 1
      };
      
    }
    else{
      sum[obj[attr]]= {
        group:obj[attr],
        value:sum[obj[attr]].value+1
      };
     } 
  });


  var rta=[];
  for(var j in sum){

    rta.push({
       group:sum[j].group,
       value:sum[j].value 
    });

  }

  return rta;
}


function drawHeader(someData, idTable){

  fields = extractFields(someData);

  var table = "<thead><tr>";

  for(var k in  fields) {
    if (fields[k].field != "table" && fields[k].field != "graph" && fields[k].field != "pkey")
      table += "<th>" + fields[k].field + "</th>";
  }

  table += "</tr></thread>";

  $('#'+idTable).append(table);

}

function extractFields(obj){
  
  var fields = [];
  var row = obj[0];

  for (prop in row) {
    if(typeof obj[prop] != "function" && typeof obj[prop] != "object"){
      fields.push({field:prop});
    }
  }

  return fields;
}


