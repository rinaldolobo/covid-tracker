import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http:HttpClient) { }

  endpoint = 'https://api.covid19api.com/';
  theme;

  getWorldSummary(){
    return this.http.get(this.endpoint + 'summary');
  }

  getLiveCasesByCountry(country){
    return this.http.get(this.endpoint + 'live/country/'+country);
  }

  getAllCasesByCountry(country){
    return this.http.get(this.endpoint + 'total/country/'+country);
  }

  formatNumber(number,compact){
    // @ts-ignore
    let num = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3, compactDisplay: 'short', notation: compact?'compact':'standard' }).format(number);
    return num;
  }
}
