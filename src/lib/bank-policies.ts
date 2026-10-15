export interface BankPolicy {
    bankGroup: string
    lockoutMonths: number
    cards: string[]
  }
  
  export const AUSTRALIAN_BANK_POLICIES: BankPolicy[] = [
    {
      bankGroup: 'American Express',
      lockoutMonths: 18,
      cards: [
        'Qantas Amex Ultimate',
        'Velocity Amex Platinum',
        'Amex Explorer Credit Card',
        'Amex Platinum Edge',
        'Amex Essential Credit Card',
      ],
    },
    {
      bankGroup: 'NAB',
      lockoutMonths: 18,
      cards: [
        'NAB Qantas Rewards Signature',
        'NAB Qantas Rewards Premium',
        'NAB Rewards Signature',
        'NAB Velocity Rewards Premium',
      ],
    },
    {
      bankGroup: 'Westpac',
      lockoutMonths: 12,
      cards: [
        'Westpac Altitude Qantas Black',
        'Westpac Altitude Velocity Black',
        'Westpac Altitude Qantas Platinum',
        'Westpac Altitude Rewards Black',
      ],
    },
    {
      bankGroup: 'ANZ',
      lockoutMonths: 12,
      cards: [
        'ANZ Frequent Flyer Black',
        'ANZ Frequent Flyer Platinum',
        'ANZ Rewards Black',
        'ANZ Rewards Platinum',
      ],
    },
    {
      bankGroup: 'Commonwealth Bank',
      lockoutMonths: 12,
      cards: ['CBA Ultimate Awards', 'CBA Awards Platinum'],
    },
    {
      bankGroup: 'Bankwest',
      lockoutMonths: 24,
      cards: ['Bankwest More Mastercard', 'Bankwest Qantas Platinum'],
    },
    {
      bankGroup: 'HSBC',
      lockoutMonths: 12,
      cards: [
        'HSBC Star Alliance Credit Card',
        'HSBC Premier World Mastercard',
        'HSBC Platinum Credit Card',
      ],
    },
    {
      bankGroup: 'Citi / NAB Group',
      lockoutMonths: 12,
      cards: ['Citi Premier Qantas Card', 'Citi Prestige Card'],
    },
    {
      bankGroup: 'Other / Custom Bank',
      lockoutMonths: 12,
      cards: ['Custom Card Product'],
    },
  ]