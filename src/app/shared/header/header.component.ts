import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {ApiService} from "../../services/api.service"

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output() updateTheme = new EventEmitter<any>();
  currentTheme = localStorage.getItem('c19-theme');

  constructor(private api:ApiService) {}

  ngOnInit() {
  	console.log(this.currentTheme);
    if(!this.currentTheme){
      this.currentTheme = 'dark-theme';
      localStorage.setItem('c19-theme',this.currentTheme);
    }
    this.api.theme = this.currentTheme;
    document.body.classList.remove('dark-theme');
    document.body.classList.remove('light-theme');
    document.body.classList.add(this.currentTheme);
    this.updateTheme.emit(this.currentTheme);
  }

  setTheme(){
  	this.currentTheme = this.currentTheme==='dark-theme'?'light-theme':this.currentTheme==='light-theme'?'dark-theme':'dark-theme';
  	this.api.theme = this.currentTheme;
  	document.body.classList.remove('dark-theme');
    document.body.classList.remove('light-theme');
  	document.body.classList.add(this.currentTheme);
  	localStorage.setItem('c19-theme',this.currentTheme);
  	console.log(this.updateTheme);
    this.updateTheme.emit(this.currentTheme);
  }

}
