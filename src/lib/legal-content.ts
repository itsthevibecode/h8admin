export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  slug: string
  title: string
  navLabel: string
  effectiveDate: string
  version: string
  summary: string
  sections: LegalSection[]
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    navLabel: 'Terms and Conditions',
    effectiveDate: '25 November 2026',
    version: '1.1',
    summary:
      'The contract for using H8Admin as a bill-payment routing service, including fees and promotional credits.',
    sections: [
      {
        heading: 'Payment routing model',
        paragraphs: [
          'H8Admin Pty Ltd provides software that helps you give participating billers a permanent payment address and route bill payments from funding sources you connect. H8Admin is not an authorised deposit-taking institution, is not a lender, and does not offer overdrafts or shortfall cover.',
          'A Virtual BSB and account number is intended as a routing address for billers. It is not presented as an everyday spending account or unrestricted stored-value wallet. How customer funds are handled depends on banking and payment-partner arrangements, which remain subject to legal and regulatory confirmation.',
        ],
      },
      {
        heading: 'Virtual BSB licence to use',
        paragraphs: [
          'Where we issue a Virtual BSB, we grant you a personal, non-transferable licence to give that address to your billers for supported direct debit and related instructions. You must not sell, sublicense, or represent that address as a deposit account.',
          'We may suspend or reissue a Virtual BSB if it is used for a purpose other than routing your own household, personal, or investment-property bills, or if required by our payment partners or by law. Allocation of any particular BSB range depends on confirmed partner arrangements.',
        ],
      },
      {
        heading: 'Fees',
        paragraphs: [
          'The standard H8Admin customer fee is a flat $1.00 for each successfully completed bill payment. That fee is only charged when the relevant payment successfully completes, and it is disclosed before you authorise the payment.',
          'Failed, declined or pending payments are not charged the $1.00 H8Admin success fee. Payment-provider costs incurred by H8Admin are H8Admin’s business cost and are not published as a separate customer surcharge.',
          'Private-beta accounts may temporarily use a different fee arrangement. Any such arrangement will be shown in your billing view. Biller, card-scheme or bank fees charged by third parties remain separate.',
        ],
      },
      {
        heading: 'Promotional and referral credits',
        paragraphs: [
          'Referral and promotional credits may be stored as an account credit balance. The balance is not cash, is not redeemable for money, and cannot be transferred except as we expressly allow.',
          'While a credit balance remains, it may be applied against eligible future H8Admin fees as described in the promotion or referral offer. Credits do not guarantee that any particular payment will succeed.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'You must be the account holder, or authorised by them, for every funding source and biller you connect. You must not use H8Admin to conceal the source of funds, to process a third party’s payments, or to evade a stop on a direct debit you are not entitled to cancel.',
          'These terms are governed by the laws of Western Australia.',
        ],
      },
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    navLabel: 'Privacy Policy',
    effectiveDate: '25 November 2026',
    version: '1.1',
    summary:
      'How H8Admin handles personal information under the Australian Privacy Principles, including card tokenization and referral disclosures.',
    sections: [
      {
        heading: 'Who we are',
        paragraphs: [
          'H8Admin Pty Ltd, registered in Western Australia, is the controller of personal information collected through h8admin.com. Contact privacy enquiries via the address published on your account.',
          'We handle personal information in line with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).',
        ],
      },
      {
        heading: 'What we collect',
        paragraphs: [
          'We collect your name, email, household membership, Virtual BSB, biller names, debit amounts, and routing preferences so we can run the service.',
          'We do not collect or store full card numbers or bank login secrets. Eligible card details are tokenized by our payment partners. H8Admin stores only the token reference, brand, and last four digits. A payment partner’s PCI compliance does not mean H8Admin itself holds PCI-DSS Level 1 certification.',
        ],
      },
      {
        heading: 'Why we use it',
        paragraphs: [
          'We use personal information to authenticate you, route debits, calculate fees, send in-app notices, and meet record-keeping duties. We do not sell personal information.',
          'Household partners see joint Virtual BSB activity. Personal bills stay private unless you turn on sharePersonalBills. Funding-card details are never shown to a partner.',
        ],
      },
      {
        heading: 'Lead and referral disclosure',
        paragraphs: [
          'If you ask us to introduce you to a tax agent, accountant, or mortgage broker, we may share your name, contact details, and the bill category you asked about so that person can contact you.',
          'We tell you before that disclosure. You can refuse the introduction. Any fee we receive for a successful introduction is described in the Financial Services Guide.',
        ],
      },
      {
        heading: 'Access, correction, and complaints',
        paragraphs: [
          'You may ask for access to, or correction of, personal information we hold. If you are not satisfied with our response, you may complain to the Office of the Australian Information Commissioner.',
          'We keep transaction and identity records for at least seven years where the AML/CTF Act 2006 or taxation law requires it, and delete or de-identify other information when we no longer need it.',
        ],
      },
    ],
  },
  {
    slug: 'direct-debit-request-agreement',
    title: 'DDR Service Agreement',
    navLabel: 'DDR Service Agreement',
    effectiveDate: '25 November 2026',
    version: '1.1',
    summary:
      'Your authority for H8Admin to arrange BECS and PayTo direct debits against your nominated funding source.',
    sections: [
      {
        heading: 'Authority',
        paragraphs: [
          'By linking a funding source you request and authorise H8Admin, and its payment partners, to arrange direct debits and PayTo payments for billers who debit your Virtual BSB. This is a Direct Debit Request service agreement for the purposes of the AusPayNet BECS rules and the PayTo framework.',
          'The debit is drawn from the card or account you nominated. H8Admin is not presented as an unrestricted stored-value wallet. Any intermediate settlement or ledger arrangements with banking partners remain subject to legal and regulatory confirmation.',
        ],
      },
      {
        heading: 'Amount and timing',
        paragraphs: [
          'We debit the amount the biller claims, plus any platform fee that is collected with that instruction or on the monthly invoice. We do not change a biller’s amount.',
          'If a routing rule selects a different funding source, that source is the one debited. If no rule matches, your default funding source is used.',
        ],
      },
      {
        heading: 'Dishonour',
        paragraphs: [
          'If your funding source declines, expires, or has insufficient funds or limit, the payment fails or remains pending under your rules and you are notified. You remain liable to the biller for the underlying bill. H8Admin does not lend money, cover shortfalls, or guarantee that a payment will succeed.',
          'You must keep a working funding source on the account while billers are debiting your permanent payment details. H8Admin is not liable for late fees, default listings, or service disconnection that follow a funding failure.',
        ],
      },
      {
        heading: 'Cancellation',
        paragraphs: [
          'You may cancel this authority by removing the funding source in H8Admin or by writing to us. Cancellation stops future routing. It does not recall a debit already submitted to the scheme, and it does not cancel your contract with the biller.',
          'You should also tell the biller to stop debiting the Virtual BSB. Under the BECS rules you may also dispute an unauthorised or incorrect debit with your card issuer or financial institution within the scheme time limits.',
        ],
      },
    ],
  },
  {
    slug: 'financial-services-guide',
    title: 'Financial Services Guide',
    navLabel: 'Financial Services Guide',
    effectiveDate: '19 October 2026',
    version: '1.0',
    summary:
      'General advice warning, the statement that H8Admin does not hold an AFSL, and referral-fee disclosures.',
    sections: [
      {
        heading: 'General advice warning',
        paragraphs: [
          'Anything H8Admin shows about bill benchmarks, savings estimates, points timers, or product comparisons is general information only. It is prepared without taking into account your objectives, financial situation, or needs.',
          'This warning is given for the purposes of ASIC Regulatory Guide 175 and Regulatory Guide 244. You should consider whether the information is appropriate for you and, if needed, get advice from a person who is licensed to advise you.',
        ],
      },
      {
        heading: 'No Australian financial services licence',
        paragraphs: [
          'H8Admin Pty Ltd does not hold an Australian financial services licence (AFSL). We do not provide personal financial product advice, deal in a financial product on your behalf, or operate a registered managed investment scheme.',
          'Savings figures on Find cheaper bills are illustrative benchmarks against published market medians. They are not a quote, a promise of a saving, or a recommendation to switch.',
        ],
      },
      {
        heading: 'Accountant and tax-agent referrals',
        paragraphs: [
          'H8Admin may later introduce you to a CPA, tax agent, or accountant. If that happens and an introduction results in an engagement, H8Admin may receive a referral fee from the practitioner. Any such fee is paid by the practitioner, not added to your H8Admin invoice.',
          'Referral commissions are a potential future revenue stream and are not a confirmed current product feature. The practitioner, not H8Admin, is responsible for the advice they give.',
        ],
      },
      {
        heading: 'Mortgage broker referrals',
        paragraphs: [
          'If we later introduce you to a mortgage broker, that broker must disclose their own commissions to you under the law that applies to credit assistance. H8Admin may receive a separate introducer fee from the broker if such arrangements are put in place.',
          'We will tell you that a fee may be payable before we pass on your details. We do not recommend a particular credit contract. These introducer arrangements are potential future capabilities, not a confirmed current feature.',
        ],
      },
    ],
  },
  {
    slug: 'aml-ctf-disclosure',
    title: 'AML/CTF Compliance Disclosure',
    navLabel: 'AML/CTF Disclosure',
    effectiveDate: '19 October 2026',
    version: '1.0',
    summary:
      'How H8Admin approaches AUSTRAC oversight, designated services, and the seven-year record-keeping duty.',
    sections: [
      {
        heading: 'AUSTRAC oversight',
        paragraphs: [
          'Australia’s anti-money laundering and counter-terrorism financing regime is administered by AUSTRAC under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth).',
          'Where H8Admin provides a designated service, it will enrol with AUSTRAC, adopt an AML/CTF program, and report suspicious matters, threshold transactions, and international funds-transfer instructions as the Act requires.',
        ],
      },
      {
        heading: 'Designated services',
        paragraphs: [
          'Routing a direct debit through a Virtual BSB can fall within designated remittance or payment services once the service is offered to the public at scale. Pre-beta use is limited to identified account holders routing their own bills.',
          'We do not provide accounts to unidentified persons, and we do not accept instructions to pay a person who is not the biller that debited your Virtual BSB.',
        ],
      },
      {
        heading: 'Customer identification',
        paragraphs: [
          'Before a designated service is provided we may require your full name, date of birth, residential address, and a verification document. We may refuse or suspend service if identification cannot be completed.',
          'You must tell us if you are acting for someone else. We do not knowingly provide the service to a person who is prohibited from receiving it.',
        ],
      },
      {
        heading: 'Seven-year retention',
        paragraphs: [
          'Records of customer identification, account activity, and designated-service transactions are retained for seven years after the record is created, as required by the AML/CTF Act. That retention overrides a shorter deletion period in the Privacy Policy.',
          'Records are stored so they can be produced to AUSTRAC or another competent authority on a lawful request. They are not used for marketing.',
        ],
      },
    ],
  },
]

const documentsBySlug = new Map(LEGAL_DOCUMENTS.map((document) => [document.slug, document]))

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return documentsBySlug.get(slug)
}
