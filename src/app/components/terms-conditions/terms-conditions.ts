import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TermsConditionsTemplate } from '../terms-conditions-template/terms-conditions-template';
@Component({
  selector: 'app-terms-conditions',
  imports: [TermsConditionsTemplate],
  templateUrl: './terms-conditions.html',
  styleUrl: './terms-conditions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsConditions {}
