import { Component, Input, OnInit, inject, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline } from 'ionicons/icons';
import * as THREE from 'three';
import { RecommendationService } from '../services/recommendation.service';
import { Stand } from '../models/stand.model';

@Component({
  selector: 'app-threed-map',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div #threeContainer class="three-container"></div>
    
    <div *ngIf="suggestion" class="recommendation-card animate-hologram">
      <div class="sparkle-icon">
        <ion-icon name="sparkles-outline"></ion-icon>
      </div>
      <div class="suggestion-text">
        <h3>✨ Recomendación Inteligente</h3>
        <p>¡Te sugerimos visitar ahora el stand de <strong>{{ suggestion.nombre }}</strong>, preparado por <strong>{{ suggestion.responsable }}</strong>!</p>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item"><span class="box-green"></span> Visitado</div>
      <div class="legend-item"><span class="box-gold"></span> Pendiente</div>
    </div>
  `,
  styles: [`
    .three-container { width: 100%; height: 50vh; border-radius: 20px; overflow: hidden; background: #f0f2f5; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }
    
    .recommendation-card {
      margin-top: 15px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 249, 230, 0.9) 100%);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1.5px solid #ffd700;
      display: flex;
      align-items: center;
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
      position: relative;
      overflow: hidden;
    }

    .animate-hologram {
      animation: hologramPulse 3s infinite ease-in-out;
    }

    @keyframes hologramPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2); border-color: #ffd700; }
      50% { transform: scale(1.02); box-shadow: 0 12px 35px rgba(212, 175, 55, 0.4); border-color: #ff9d00; }
    }

    .recommendation-card::after {
      content: '';
      position: absolute;
      top: -100%; left: -100%; width: 50%; height: 300%;
      background: linear-gradient(120deg, transparent, rgba(255,255,255,0.6), transparent);
      transform: rotate(25deg);
      animation: sweep 4s infinite;
    }

    @keyframes sweep {
      0% { left: -100%; }
      50%, 100% { left: 200%; }
    }

    .sparkle-icon { 
      font-size: 1.8rem; 
      color: #dfb300; 
      margin-right: 15px;
      animation: spin 6s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .suggestion-text h3 { margin: 0; font-size: 0.85rem; color: #b8860b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .suggestion-text p { margin: 5px 0 0; font-size: 0.95rem; color: #333; line-height: 1.4; }
  `]
})
export class ThreeDMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() visitedStandIds: string[] = [];
  @Input() allStands: Stand[] = [];

  @ViewChild('threeContainer') container!: ElementRef;

  private recommendationService = inject(RecommendationService);
  suggestion: Stand | null = null;
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationId: number | null = null;

  constructor() {
    addIcons({ sparklesOutline });
  }

  ngOnInit() {
    this.updateSuggestion();
  }

  ngOnChanges() {
    this.updateSuggestion();
    if (this.renderer) {
      this.initThree(); // Re-render scene with new data
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
  }

  private updateSuggestion() {
    if (this.allStands.length > 0) {
      this.suggestion = this.recommendationService.getSmartSuggestion(this.allStands, this.visitedStandIds);
    }
  }

  ngAfterViewInit() {
    this.retryInit();
  }

  private retryInit() {
    const el = this.container.nativeElement;
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      this.initThree();
    } else {
      // If no dimensions (modal transition?), wait for next frame
      requestAnimationFrame(() => this.retryInit());
    }
  }

  private onResize = () => {
    const el = this.container?.nativeElement;
    if (!el || !this.camera || !this.renderer) return;
    this.camera.aspect = el.clientWidth / el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(el.clientWidth, el.clientHeight);
  };

  private initThree() {
    const el = this.container.nativeElement;
    this.cleanup(); 
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf4f4f4);

    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 1000);
    this.camera.position.set(6, 6, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(5, 10, 7.5);
    this.scene.add(light);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshPhongMaterial({ color: 0xdddddd }));
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.allStands.forEach((stand, index) => {
      const isVisited = this.visitedStandIds.includes(stand.id || '');
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.6, 1),
        new THREE.MeshPhongMaterial({ color: isVisited ? 0x2dd36f : 0xffd700 })
      );
      const row = Math.floor(index / 3);
      const col = index % 3;
      cube.position.set((col - 1) * 3, 0.3, (row - 1) * 3);
      this.scene.add(cube);
    });

    const animate = () => {
      if (!this.renderer) return;
      this.animationId = requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    window.addEventListener('resize', this.onResize);
  }
}
