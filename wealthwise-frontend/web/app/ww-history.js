import {LitElement, html, css} from 'lit';

import MarkdownIt from 'markdown-it';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@vaadin/item';
import '@vaadin/list-box';
import '@vaadin/progress-bar';
import '@vaadin/grid';

class WwHistory extends LitElement {
    static styles = css`
        :host {
            height: 100%;
            width: 100%;
            padding-bottom: 20px;
        }
        
        vaadin-progress-bar{
            width: 80%;
        }
    `;
    
    static properties = {
        _history: {state:  true},
        _inprogress: {state: true},
    };
    
    constructor() {
        super();
        this._history = [];
        this._inprogress = false;
        
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._inprogress = true;

        
        var _this = this;

        this.ajax = new XMLHttpRequest();
        this.ajax.addEventListener("load", function() { _this.onAjaxLoad(); });
        let data = {
            "message": "get"
        };
        this.ajax.open("POST", "advisor-history/getHistory", JSON.stringify(data));
        this.ajax.send();
    }

    onAjaxLoad() {
        this._inprogress = false;
        this._history = JSON.parse(this.ajax.responseText).message;
    }
        
    render(){
        if(this._inprogress){
            return html`<vaadin-progress-bar indeterminate></vaadin-progress-bar>`;
        }else if(this._history){
            return html`<vaadin-grid .items=${this._history}>
                    <vaadin-grid-column path="id" auto-width></vaadin-grid-column>  
                    <vaadin-grid-column path="timestamp" auto-width></vaadin-grid-column>
                    <vaadin-grid-column path="question" auto-width></vaadin-grid-column>
                    <span slot="empty-state">No history found.</span>
                </vaadin-grid>`;
        }else{
            return html`<span>No history</span>`;
        }
        
    }

}
customElements.define('ww-history', WwHistory);
