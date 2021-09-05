import {Component, Input, NgZone, OnChanges, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import colors from "../../shared/colors";

@Component({
  selector: 'app-world-view',
  templateUrl: './world-view.component.html',
  styleUrls: ['./world-view.component.scss']
})
export class WorldViewComponent implements OnInit,OnChanges {

  mapData;
  polygonSeries;
  chart;
  imageSeries = {
    totalConfirmed:null,
    totalDeaths:null,
    newConfirmed:null
  }
  imageTemplate = {
    totalConfirmed:null,
    totalDeaths:null,
    newConfirmed:null
  };

  am4maps;
  am4core;
  am4themes_animated;
  am4themes_dark;
  am4geodata_worldLow;

  @Input() fullSet;
  @Input() series;
  @Input() theme;
  @Input() activeItem;
  @Input() hoveredItem;

  constructor(private api:ApiService,private zone: NgZone) {}

  ngOnChanges(changes) {
    this.zone.runOutsideAngular(() => {
      Promise.all([
        import("@amcharts/amcharts4/core"),
        import("@amcharts/amcharts4/maps"),
        import("@amcharts/amcharts4/themes/animated"),
        import("@amcharts/amcharts4/themes/dark"),
        import("@amcharts/amcharts4-geodata/worldLow"),
      ]).then(modules => {
        this.am4core = modules[0];
        this.am4maps = modules[1];
        this.am4themes_animated = modules[2].default;
        this.am4themes_dark = modules[3].default;
        this.am4geodata_worldLow = modules[4].default;

        this.setMapColors();
        if(!this.chart) {
          this.plotMap();
        }
        if(this.fullSet) {
          if (this.series === 'tc') {
            this.changeDataSetToTC();
          }
          if (this.series === 'td') {
            this.changeDataSetToTD();
          }
          if (this.series === 'nc') {
            this.changeDataSetToNC();
          }
        }
        let series = this.series === 'tc' ? 'totalConfirmed' : this.series === 'td' ? 'totalDeaths' : 'newConfirmed';
        if(changes['activeItem']||changes['series']){
          setTimeout(()=>{
            this.resetHover(series);
            if(this.activeItem&&this.chart&&this.polygonSeries) {
              let mapPolygon = this.polygonSeries.getPolygonById(this.activeItem);
              if (mapPolygon) {
                this.chart.zoomToMapObject(mapPolygon);
                mapPolygon.polygon.fill = this.am4core.color(this.theme === 'dark-theme' ? colors.dmActivePolygonBg : colors.lmActivePolygonBg);
                mapPolygon.polygon.stroke = this.am4core.color(this.theme === 'dark-theme' ? colors.dmMapBg : colors.lmMapBg);
              }
            }
            else{
              setTimeout(()=>{
                if(this.activeItem&&this.chart&&this.polygonSeries) {
                  let mapPolygon = this.polygonSeries.getPolygonById(this.activeItem);
                  if (mapPolygon) {
                    this.chart.zoomToMapObject(mapPolygon);
                    mapPolygon.polygon.fill = this.am4core.color(this.theme === 'dark-theme' ? colors.dmActivePolygonBg : colors.lmActivePolygonBg);
                    mapPolygon.polygon.stroke = this.am4core.color(this.theme === 'dark-theme' ? colors.dmMapBg : colors.lmMapBg);
                  }
                }
              },1000)
            }
          }, 100)
        }
        if(changes['hoveredItem']){
          setTimeout(()=>{
            if(this.hoveredItem&&this.chart&&this.polygonSeries) {
              this.resetHover(series);
              let mapPolygon = this.polygonSeries.getPolygonById(this.hoveredItem);
              if (mapPolygon) {
                this.chart.goHome(100);
                setTimeout(()=>{
                  if (mapPolygon&&(this.hoveredItem)) {
                    mapPolygon.isHover = true;
                    var image = this.imageSeries[series].getImageById(mapPolygon.dataItem.id);
                    if (image) {
                      image.dataItem.dataContext.name = mapPolygon.dataItem.dataContext.name;
                      image.isHover = true;
                    }
                  }
                },this.chart.zoomDuration+50)
              }
            }
            else if(!changes['activeItem']){
              setTimeout(()=>{
                if(this.chart&&this.polygonSeries&&this.activeItem) {
                  this.resetHover(series);
                  let mapPolygon = this.polygonSeries.getPolygonById(this.activeItem);
                  if (mapPolygon) {
                    this.chart.zoomToMapObject(mapPolygon);
                  }
                }
              },this.chart.zoomDuration)
            }
          },)
        }
      }).catch(e => {
        console.error("Error when creating chart", e);
      });
    });
  }

  resetHover(series) {
    if(this.polygonSeries&&this.imageSeries[series]) {
      this.polygonSeries.mapPolygons.each((polygon) => {
        polygon.isHover = false;
        if(polygon&&polygon.dataItem.id!==this.activeItem) {
          polygon.polygon.fill = this.am4core.color(this.theme === 'dark-theme' ? colors.dmPolygonBg : colors.lmPolygonBg);
        }
      })

      this.imageSeries[series].mapImages.each((image) => {
        image.isHover = false;
      })
    }
  }

  ngOnInit() {

  }

  createNCSeries(){
    let data = [];
    this.fullSet.forEach(obj=>{
      data.push({
        id:obj['CountryCode'],
        name:obj['Country'],
        value:obj['TotalRecovered'],
        color:colors.recoveredType
      })
    });
    this.plotPoints(data,'newConfirmed');
  }

  createTDSeries(){
    let data = [];
    this.fullSet.forEach(obj=>{
      data.push({
        id:obj['CountryCode'],
        name:obj['Country'],
        value:obj['TotalDeaths'],
        color:colors.deceasedType
      })
    });
    this.plotPoints(data,'totalDeaths');
  }

  createTCSeries(){
    let data = [];
    this.fullSet.forEach(obj=>{
      data.push({
        id:obj['CountryCode'],
        name:obj['Country'],
        value:obj['TotalConfirmed'],
        color:colors.confirmedType
      })
    });
    this.plotPoints(data,'totalConfirmed');
  }

  changeDataSetToTC(){
    this.imageSeries['totalDeaths']?this.imageSeries['totalDeaths'].dispose():'';
    this.imageSeries['newConfirmed']?this.imageSeries['newConfirmed'].dispose():'';
    (!this.imageSeries['totalConfirmed']||this.imageSeries['totalConfirmed']['_disposed'])&&this.createTCSeries();
  }

  changeDataSetToTD(){
    this.imageSeries['totalConfirmed']?this.imageSeries['totalConfirmed'].dispose():'';
    this.imageSeries['newConfirmed']?this.imageSeries['newConfirmed'].dispose():'';
    (!this.imageSeries['totalDeaths']||this.imageSeries['totalDeaths']['_disposed'])&&this.createTDSeries();
  }

  changeDataSetToNC(){
    this.imageSeries['totalConfirmed']?this.imageSeries['totalConfirmed'].dispose():'';
    this.imageSeries['totalDeaths']?this.imageSeries['totalDeaths'].dispose():'';
    (!this.imageSeries['newConfirmed']||this.imageSeries['newConfirmed']['_disposed'])&&this.createNCSeries();
  }

  plotPoints(data,type){
    this.mapData = data;

    this.polygonSeries.events.on("validated", () => {
      this.imageSeries[type].invalidate();
    })

    if(this.imageSeries[type]) {
      this.imageSeries[type].invalidate();
      this.imageSeries[type].invalidateRawData();
    }

    this.imageSeries[type] = this.chart.series.push(new this.am4maps.MapImageSeries());
    this.imageSeries[type].tooltip.background.strokeWidth = 0;
    this.imageSeries[type].tooltip.fontSize = 14;
    this.imageSeries[type].tooltip.animationDuration = 0;
    this.imageSeries[type].data = this.mapData;
    this.imageSeries[type].dataFields.value = "value";
    this.imageSeries[type].interpolationDuration = 500;


    this.imageTemplate[type] = this.imageSeries[type].mapImages.template;
    this.imageTemplate[type].nonScaling = true;
    this.imageTemplate[type].applyOnClones = true;
    this.imageTemplate[type].fillOpacity = 0.7;
    this.imageTemplate[type].propertyFields.fill = "color";
    this.imageTemplate[type].tooltipText = "{name}: [bold]{value}[/]";

    this.imageTemplate[type].adapter.add("latitude", (latitude, target) => {
      var polygon = this.polygonSeries.getPolygonById(target.dataItem.dataContext['id']);
      if(polygon){
        return polygon.visualLatitude;
      }
      return latitude;
    })

    this.imageTemplate[type].adapter.add("longitude", (longitude, target) => {
      var polygon = this.polygonSeries.getPolygonById(target.dataItem.dataContext['id']);
      if(polygon){
        return polygon.visualLongitude;
      }
      return longitude;
    })

    this.imageTemplate[type].adapter.add("tooltipY", (tooltipY, target) =>{
      return -target.children.getIndex(0).radius;
    })

    var circle = this.imageTemplate[type].createChild(this.am4core.Circle);

    circle.events.on('inited',(event)=>{
      this.animateBullet(event.target);
    })

    this.imageSeries[type].heatRules.push({
      "target": circle,
      "property": "radius",
      "min": 2,
      "max": 30,
      "dataField": "value"
    });

    if(this.imageSeries[type]&&!this.imageSeries[type]['_disposed']) {
      this.imageSeries[type].events.on("dataitemsvalidated", () => {
        this.imageSeries[type].dataItems.each((dataItem) => {
          var mapImage = dataItem.mapImage;
          var circle = mapImage.children.getIndex(0);
          if (mapImage.dataItem.value == 0) {
            circle.hide(0);
          } else if (circle.isHidden || circle.isHiding) {
            circle.show();
          }
        })
      })
    }
  }

  animateBullet(circle) {
    circle.animate([{ property: "scale", from: 0.001, to: 1 }], 2000, this.am4core.ease.elasticOut);
  }

  plotMap(){
    this.am4core.unuseTheme(this.am4themes_animated);

    this.chart = this.am4core.create("chartdiv", this.am4maps.MapChart);
    this.chart.zoomControl = new this.am4maps.ZoomControl();
    this.chart.geodata = this.am4geodata_worldLow;
    this.chart.projection = new this.am4maps.projections.Miller();
    this.chart.backgroundSeries.mapPolygons.template.polygon.fillOpacity = 1;
    this.chart.chartContainer.wheelable = false;
    this.chart.responsive.enabled = true;
    this.chart.tapToActivate = true;

    this.polygonSeries = this.chart.series.push(new this.am4maps.MapPolygonSeries());
    this.polygonSeries.dataFields.id = "id";
    this.polygonSeries.exclude = ["AQ"];
    this.polygonSeries.useGeodata = true;
    this.polygonSeries.nonScalingStroke = true;
    this.polygonSeries.strokeWidth = 0;
    this.polygonSeries.calculateVisualCenter = true;
    this.polygonSeries.interpolationDuration = 0;
    this.polygonSeries.mapPolygons.template.polygon.strokeWidth = 0.5;
    this.polygonSeries.mapPolygons.template.tooltipPosition = "fixed";

    this.setMapColors();

    this.am4core.options.autoDispose = true;
  }

  setMapColors(){
    if(this.chart&&this.polygonSeries) {
      this.chart.backgroundSeries.mapPolygons.template.polygon.fill = this.am4core.color(this.theme==='dark-theme'?colors.dmMapBg:colors.lmMapBg);
      this.polygonSeries.mapPolygons.template.polygon.fill = this.am4core.color(this.theme==='dark-theme'?colors.dmPolygonBg:colors.lmPolygonBg);
      this.polygonSeries.mapPolygons.template.polygon.stroke = this.am4core.color(this.theme==='dark-theme'?colors.dmMapBg:colors.lmMapBg);
      if(this.activeItem) {
        let mapPolygon = this.polygonSeries.getPolygonById(this.activeItem);
        if(mapPolygon) {
          mapPolygon.polygon.fill = this.am4core.color(this.theme === 'dark-theme' ? colors.dmActivePolygonBg : colors.lmActivePolygonBg);
        }
      }
    }
  }
}
