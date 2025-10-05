import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private loadingCount = 0;

  setLoading(loading: boolean): void {
    if (loading) {
      this.loadingCount++;
    } else {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
    }

    this.loadingSubject.next(this.loadingCount > 0);
  }

  getLoading(): boolean {
    return this.loadingSubject.value;
  }

  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }
}
