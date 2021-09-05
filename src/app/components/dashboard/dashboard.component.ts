import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {Router} from "@angular/router";
import colors from "../../shared/colors";
import {NgScrollbar} from "ngx-scrollbar";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @ViewChild(NgScrollbar) scrollable: NgScrollbar;

  constructor(public api:ApiService, private router:Router) { }

  colors;
  summaryData;
  series = 'tc';
  countries;
  searchQuery = '';
  activeItem;
  hoveredItem;
  isMobile = false;
  theme = localStorage.getItem('c19-theme');

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 768;
    this.colors = colors;
    this.api.getWorldSummary().subscribe(res=>{
      this.summaryData = res;
      this.sortData();
    })
  }

  sortData(){
    this.summaryData['Countries'].sort((a,b)=>{
      let series = this.series==='tc'?'TotalConfirmed':this.series==='td'?'TotalDeaths':'TotalRecovered';
      return b[series]-a[series]
    });
    this.activeItem = this.activeItem?this.activeItem:this.summaryData['Countries'][0];
    this.hoveredItem = this.hoveredItem?this.hoveredItem:null;
    if(this.scrollable) {
      setTimeout(()=>{
        this.scrollable.scrollToElement('#' + this.activeItem['Slug']);
      },100)
    }
  }

  updateTheme(theme){
    this.theme = theme;
  }

  updateCountryStats(country){
    if(this.activeItem!==country) {
      this.activeItem = country;
      this.hoveredItem = null;
      if (this.isMobile) {
        let offset = (document.getElementsByClassName('chart-main')[0] as HTMLElement).offsetTop
        window.scrollTo({left: 0, top: offset, behavior: 'smooth'});
      }
    }
  }

  @HostListener('window:resize')
  resize(){
    this.isMobile = window.innerWidth < 768;
  }
}
