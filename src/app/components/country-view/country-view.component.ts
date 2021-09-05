import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ApiService} from "../../services/api.service";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import colors from "../../shared/colors";

@Component({
  selector: 'app-country-view',
  templateUrl: './country-view.component.html',
  styleUrls: ['./country-view.component.scss']
})
export class CountryViewComponent implements OnInit, OnChanges {

  @Input() country;
  @Input() activeSeries;
  @Input() theme;

  colors;
  title;
  fullSet;
  dailySet;
  monthlySet;
  currentSetName = 'fullSet';
  currentSet;
  chart = {
    confirmed:null,
    deaths:null,
    active:null
  };
  series = {
    confirmed:null,
    deaths:null,
    active:null
  }
  categoryAxis = {
    confirmed:null,
    deaths:null,
    active:null
  }
  valueAxis = {
    confirmed:null,
    deaths:null,
    active:null
  }
  totalConfirmed = {
    fullSet:0,
    dailySet:0,
    monthlySet:0
  }
  totalDeaths = {
    fullSet:0,
    dailySet:0,
    monthlySet:0
  }
  totalRecovered = {
    fullSet:0,
    dailySet:0,
    monthlySet:0
  }

  constructor(public api:ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    this.colors = colors;
    if(changes['country']){
      this.transformData([]);
      this.totalConfirmed['fullSet'] = this.country['TotalConfirmed'];
      this.totalDeaths['fullSet'] = this.country['TotalDeaths'];
      this.totalRecovered['fullSet'] = this.country['TotalRecovered'];
      this.api.getAllCasesByCountry(this.country['Slug']).subscribe((res)=>{
        this.transformData(res);
        if(this.currentSetName==='fullSet'){
          this.chartActions();
        }
      });

      this.api.getLiveCasesByCountry(this.country['Slug']).subscribe(res=>{
        this.makeDailyData(res);
        if(this.currentSetName==='monthlySet'||this.currentSetName==='dailySet'){
          this.chartActions();
        }
      });
    }
    if(changes['theme']){
      this.setChartColors('confirmed');
      this.setChartColors('deaths');
      this.setChartColors('recovered');
    }
  }

  setChartColors(type){
    if(this.categoryAxis[type]&&this.valueAxis[type]&&this.chart[type]){
      this.categoryAxis[type].renderer.labels.template.fill = am4core.color(this.theme==='dark-theme'?this.colors.dmAlternateText:this.colors.lmAlternateText);
      this.categoryAxis[type].tooltip.background.fill = am4core.color(this.theme==='dark-theme'?this.colors.dmDefaultBg:this.colors.lmDefaultBg);
      this.categoryAxis[type].tooltip.stroke = am4core.color(this.theme==='dark-theme'?this.colors.dmAlternateText:this.colors.lmAlternateText);
      this.valueAxis[type].renderer.labels.template.fill = am4core.color(this.theme==='dark-theme'?this.colors.dmAlternateText:this.colors.lmAlternateText);
      this.chart[type].cursor.stroke = am4core.color(this.theme==='dark-theme'?this.colors.dmDefaultBg:this.colors.lmDefaultBg);
    }
  }

  ngOnInit(): void {

  }

  chartActions(){
    this.plotChart('confirmed',this.colors.confirmedType);
    this.plotChart('deaths',this.colors.deceasedType);
    this.plotChart('recovered',this.colors.recoveredType);
    this.alignCursorMovement('confirmed','deaths','recovered');
    this.alignCursorMovement('deaths','recovered','confirmed');
    this.alignCursorMovement('recovered','confirmed','deaths');
  }

  makeDailyData(data){
    let temp = [];
    let groupedData = this.groupByKey(data, 'Date');
    for (const groupedDataKey in groupedData) {
      let newItem = {
        date:groupedDataKey,
        deaths:0,
        recovered:0,
        confirmed:0
      }
      groupedData[groupedDataKey].forEach(obj=>{
        newItem['deaths'] += obj['Deaths'];
        newItem['confirmed'] += obj['Confirmed'];
        newItem['recovered'] += obj['Recovered'];
      })
      newItem = JSON.parse(JSON.stringify(newItem));
      temp.push(newItem);
    }
    for (let i = temp.length-1;i >=1; i--){
      temp[i]['deaths'] = Math.abs(temp[i-1]['deaths'] - temp[i]['deaths']);
      temp[i]['confirmed'] = Math.abs(temp[i-1]['confirmed'] - temp[i]['confirmed']);
      temp[i]['recovered'] = Math.abs(temp[i-1]['recovered'] - temp[i]['recovered']);
    }
    temp = [...temp];
    this.createDailyData(temp);
    this.createMonthlyData(temp);
    if(this.currentSetName==='dailySet'){
      this.currentSet = this.dailySet;
    }
    if(this.currentSetName==='monthlySet'){
      this.currentSet = this.monthlySet;
    }
  }

  createDailyData(data){
    let temp = data.filter(obj=>{
      let date1 = new Date();
      let date2 = new Date(obj['date']);
      // @ts-ignore
      let diffTime = Math.abs(date2 - date1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if(diffDays<=7){
        return obj;
      }
    });
    this.dailySet = [...temp];
    this.totalConfirmed['dailySet'] = this.dailySet.reduce((a, b) => ({confirmed: a.confirmed + b.confirmed}))['confirmed'];
    this.totalDeaths['dailySet'] = this.dailySet.reduce((a, b) => ({deaths: a.deaths + b.deaths}))['deaths'];
    this.totalRecovered['dailySet'] = this.dailySet.reduce((a, b) => ({recovered: a.recovered + b.recovered}))['recovered'];
  }

  createMonthlyData(data){
    let temp = data.filter(obj=>{
      let date1 = new Date();
      let date2 = new Date(obj['date']);
      // @ts-ignore
      let diffTime = Math.abs(date2 - date1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if(diffDays<=30){
        return obj;
      }
    });
    this.monthlySet = [...temp];
    this.totalConfirmed['monthlySet'] = this.monthlySet.reduce((a, b) => ({confirmed: a.confirmed + b.confirmed}))['confirmed'];
    this.totalDeaths['monthlySet'] = this.monthlySet.reduce((a, b) => ({deaths: a.deaths + b.deaths}))['deaths'];
    this.totalRecovered['monthlySet'] = this.monthlySet.reduce((a, b) => ({recovered: a.recovered + b.recovered}))['recovered'];
  }

  groupByKey(array, key) {
    return array.reduce((hash, obj) => {
        if(obj[key] === undefined) return hash;
        return Object.assign(hash, { [obj[key]]:( hash[obj[key]] || [] ).concat(obj)})
      }, {})
  }

  transformData(data){
    let temp = [];
    data.forEach(obj=>{
      temp.push({
        date:obj['Date'],
        confirmed:obj['Confirmed'],
        deaths:obj['Deaths'],
        recovered:obj['Recovered'],
      })
    });
    this.fullSet = [...temp];
    if(this.currentSetName==='fullSet') {
      this.currentSet = this.fullSet;
    }
  }

  alignCursorMovement(type,dep1,dep2){
    this.chart[type].cursor.events.on("cursorpositionchanged", (ev) => {
      let xAxis1 = ev.target.chart.xAxes.getIndex(0);
      let date1 = new Date(xAxis1.positionToDate(xAxis1.toAxisPosition(ev.target.xPosition)));
      let point1 = this.categoryAxis[dep1].dateToPoint(date1);
      this.chart[dep1].cursor.triggerMove(point1, 'none');
      let xAxis2 = ev.target.chart.xAxes.getIndex(0);
      let date2 = new Date(xAxis2.positionToDate(xAxis2.toAxisPosition(ev.target.xPosition)));
      let point2 = this.categoryAxis[dep2].dateToPoint(date2);
      this.chart[dep2].cursor.triggerMove(point2, 'none');
    });
  }

  plotChart(type,color){
    am4core.useTheme(am4themes_animated);

    this.chart[type] = am4core.create(type+'Chart', am4charts.XYChart);
    this.chart[type].paddingRight = 20;
    this.chart[type].responsive.enabled = true;
    this.chart[type].data = this.currentSet;
    this.chart[type].tapToActivate = true;


    this.categoryAxis[type] = this.chart[type].xAxes.push(new am4charts.DateAxis());
    this.categoryAxis[type].dataFields.date = "date";
    this.categoryAxis[type].renderer.grid.template.strokeWidth = 0;
    this.categoryAxis[type].startLocation = 0.5;
    this.categoryAxis[type].endLocation = 0.5;
    this.categoryAxis[type].tooltipDateFormat = "dd MMM, YYYY";
    this.categoryAxis[type].renderer.labels.template.fontSize = 10;
    this.categoryAxis[type].tooltip.fontSize = 12;
    this.categoryAxis[type].tooltip.background.strokeWidth = 0;
    this.categoryAxis[type].renderer.inside = false;

    this.valueAxis[type] = this.chart[type].yAxes.push(new am4charts.ValueAxis());
    this.valueAxis[type].baseValue = 0;
    this.valueAxis[type].renderer.grid.template.strokeWidth = 0;
    this.valueAxis[type].cursorTooltipEnabled = false;
    this.valueAxis[type].hideCursor = true;
    this.valueAxis[type].renderer.opposite = true;
    this.valueAxis[type].numberFormatter = new am4core.NumberFormatter();
    this.valueAxis[type].numberFormatter.numberFormat = "# a";
    this.valueAxis[type].renderer.labels.template.fontSize = 10;

    this.plotSeries(type,color);
  }

  plotSeries(type,color){
    this.series[type] = this.chart[type].series.push(this.currentSetName==='fullSet'?new am4charts.LineSeries():new am4charts.ColumnSeries());
    this.series[type].dataFields.valueY = type;
    this.series[type].dataFields.dateX = "date";
    this.series[type].strokeWidth = 2;
    this.series[type].stroke = color;
    this.series[type].tooltip.background.strokeWidth = 0;
    this.series[type].tooltip.fontSize = 14;

    if(this.currentSetName!=='fullSet'){
      this.series[type].columns.template.fill = am4core.color(color);
      this.series[type].columns.template.width = am4core.percent(100);
    }

    let bullet = this.series[type].bullets.push(new am4charts.Bullet());
    bullet.tooltipText = (type==='confirmed'?"Confirmed: ":type==='deaths'?"Deceased: ":"Recovered: ")+"[bold]{"+type+"}[/]";
    bullet.adapter.add("fill", (fill, target) =>{
      return am4core.color(color);
    })

    this.chart[type].cursor = new am4charts.XYCursor();
    this.chart[type].cursor.behavior = "none";
    this.chart[type].cursor.lineY.disabled = true;
    this.chart[type].tapToActivate = true;
    this.chart[type].paddingRight = 0;

    this.setChartColors(type);
  }

  toggleSet(name){
    if(name!==this.currentSetName) {
      this.currentSetName = name;
      this.currentSet = this.currentSetName === 'fullSet' ? this.fullSet : this.currentSetName === 'dailySet' ? this.dailySet : this.monthlySet;
      this.chartActions();
    }
  }

}
