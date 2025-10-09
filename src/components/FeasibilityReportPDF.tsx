import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FeeBreakdown } from '@/lib/fee-calculator';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a365d',
    fontFamily: 'Helvetica-Bold',
  },
  coverSubtitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  coverDate: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1a365d',
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#2c5282',
    borderBottom: '2 solid #e2e8f0',
    paddingBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottom: '1 solid #cbd5e0',
    marginBottom: 15,
  },
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    paddingVertical: 8,
    fontFamily: 'Helvetica-Bold',
    borderBottom: '2 solid #2c5282',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCellRight: {
    flex: 1,
    paddingHorizontal: 5,
    textAlign: 'right',
  },
  summary: {
    backgroundColor: '#f7fafc',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2 solid #000',
    paddingTop: 8,
    marginTop: 5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  text: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 180,
    fontFamily: 'Helvetica-Bold',
  },
  detailValue: {
    flex: 1,
  },
  note: {
    fontSize: 10,
    color: '#4a5568',
    marginBottom: 5,
    paddingLeft: 10,
  },
  disclaimer: {
    fontSize: 9,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1 solid #e2e8f0',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#718096',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 8,
    textAlign: 'center',
  },
  contactBox: {
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  contactText: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  costBreakdownBar: {
    fontSize: 10,
    fontFamily: 'Courier',
    marginBottom: 3,
  },
});

interface JurisdictionContactInfo {
  contact_department?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  contact_address?: string;
  contact_hours?: string;
}

interface FeasibilityReportPDFProps {
  breakdown: FeeBreakdown;
  projectName?: string;
  projectAddress?: string;
  developerName?: string;
  contactEmail?: string;
  projectDescription?: string;
  startDate?: string;
  completionDate?: string;
  jurisdictionContactInfo?: JurisdictionContactInfo;
}

export const FeasibilityReportPDF: React.FC<FeasibilityReportPDFProps> = ({
  breakdown,
  projectName,
  projectAddress,
  developerName,
  contactEmail,
  projectDescription,
  startDate,
  completionDate,
  jurisdictionContactInfo
}) => {
  // Safely access nested properties
  const project = breakdown?.project || {};
  const fees = breakdown?.fees || [];
  const oneTimeFees = fees.filter(f => !f.isRecurring);
  const monthlyFees = fees.filter(f => f.isRecurring);

  // Calculate projections
  const fiveYearProjection = (breakdown?.oneTimeFees || 0) + ((breakdown?.annualOperatingCosts || 0) * 5);
  const tenYearProjection = (breakdown?.oneTimeFees || 0) + ((breakdown?.annualOperatingCosts || 0) * 10);

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPages = 8;

  // Helper to create footer
  const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
    <Text style={styles.footer}>
      {project.jurisdictionName || 'Development'} Feasibility Report | Page {pageNumber} of {totalPages} | Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
    </Text>
  );

  // Calculate cost breakdown percentages
  const total = breakdown.oneTimeFees || 0;
  const waterSewerFees = oneTimeFees
    .filter(f => f.category.toLowerCase().includes('water') || f.category.toLowerCase().includes('sewer'))
    .reduce((sum, f) => sum + f.calculatedAmount, 0);
  const impactFees = oneTimeFees
    .filter(f => f.category.toLowerCase().includes('impact'))
    .reduce((sum, f) => sum + f.calculatedAmount, 0);
  const operatingYear1 = breakdown.annualOperatingCosts || 0;

  return (
    <Document>
      {/* PAGE 1: COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ marginTop: 100 }}>
          <Text style={styles.coverTitle}>
            Development Fee Feasibility Report
          </Text>
          {projectName && (
            <Text style={[styles.coverSubtitle, { marginBottom: 5 }]}>
              {projectName}
            </Text>
          )}
          {project.jurisdictionName && (
            <Text style={styles.coverSubtitle}>
              {project.jurisdictionName}, {project.stateCode}
            </Text>
          )}
          {projectAddress && (
            <Text style={[styles.coverDate, { fontSize: 12, marginBottom: 10 }]}>
              {projectAddress}
            </Text>
          )}

          {developerName && (
            <Text style={[styles.coverDate, { fontSize: 13, marginTop: 30, marginBottom: 5 }]}>
              Prepared for: {developerName}
            </Text>
          )}
          {contactEmail && (
            <Text style={[styles.coverDate, { fontSize: 11, marginBottom: 5 }]}>
              {contactEmail}
            </Text>
          )}

          <Text style={[styles.coverDate, { marginTop: 20 }]}>
            Generated: {formatDate()}
          </Text>
        </View>
      </Page>

      {/* PAGE 2: EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Executive Summary</Text>

        <View style={styles.section}>
          {projectDescription && (
            <>
              <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 8 }]}>Project Overview</Text>
              <Text style={styles.text}>{projectDescription}</Text>
            </>
          )}

          <Text style={styles.text}>
            This feasibility report provides a comprehensive analysis of development fees and ongoing
            utility costs for a {project.projectType || 'development'}
            {project.useSubtype && ` - ${project.useSubtype}`} project
            {project.jurisdictionName && ` in ${project.jurisdictionName}, ${project.stateCode}`}.
          </Text>

          {project.numUnits && (
            <Text style={styles.text}>
              The project consists of {project.numUnits} {project.numUnits === 1 ? 'unit' : 'units'}
              {project.squareFeet && ` with ${project.squareFeet.toLocaleString()} square feet of total building area`}
              {project.projectValue && `, valued at $${project.projectValue.toLocaleString()}`}.
            </Text>
          )}
        </View>

        <View style={styles.summary}>
          <Text style={[styles.bold, { fontSize: 14, marginBottom: 10 }]}>
            Key Financial Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text>One-Time Development Fees:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.oneTimeFees)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Monthly Operating Costs:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.monthlyFees)}/month</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>First Year Operating Costs:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.annualOperatingCosts)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text style={[styles.bold, { fontSize: 14 }]}>Total First-Year Cost:</Text>
            <Text style={[styles.bold, { fontSize: 14 }]}>
              ${formatCurrency(breakdown.firstYearTotal)}
            </Text>
          </View>
        </View>

        {/* Cost Breakdown Visual */}
        {total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={styles.costBreakdownBar}>
                  Water/Sewer Connection: {'━'.repeat(Math.round((waterSewerFees / total) * 30))}
                </Text>
                <Text style={{ fontSize: 10 }}>
                  {Math.round((waterSewerFees / total) * 100)}% (${formatCurrency(waterSewerFees)})
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={styles.costBreakdownBar}>
                  Impact Fees:            {'━'.repeat(Math.round((impactFees / total) * 30))}
                </Text>
                <Text style={{ fontSize: 10 }}>
                  {Math.round((impactFees / total) * 100)}% (${formatCurrency(impactFees)})
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={styles.costBreakdownBar}>
                  Operating (Year 1):     {'━'.repeat(Math.round((operatingYear1 / (total + operatingYear1)) * 30))}
                </Text>
                <Text style={{ fontSize: 10 }}>
                  {Math.round((operatingYear1 / (total + operatingYear1)) * 100)}% (${formatCurrency(operatingYear1)})
                </Text>
              </View>
            </View>
          </View>
        )}

        {breakdown.byCategory && Object.keys(breakdown.byCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Major Cost Drivers</Text>
            {Object.entries(breakdown.byCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([category, amount], index) => (
                <View key={index} style={styles.summaryRow}>
                  <Text>{category}:</Text>
                  <Text>${formatCurrency(amount)}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text style={styles.text}>
            • Impact fees (${formatCurrency(impactFees)}) are due at building permit issuance - budget accordingly
          </Text>
          <Text style={styles.text}>
            • Monthly operating costs of ${formatCurrency(breakdown.monthlyFees)} begin at occupancy
          </Text>
          <Text style={styles.text}>
            • Water volume charges vary seasonally - actual costs may fluctuate throughout the year
          </Text>
        </View>

        <PageFooter pageNumber={2} />
      </Page>

      {/* PAGE 3: PROJECT DETAILS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Project Details</Text>
        <View style={styles.divider} />

        <View style={styles.section}>
          {project.jurisdictionName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jurisdiction:</Text>
              <Text style={styles.detailValue}>
                {project.jurisdictionName}, {project.stateCode}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Areas:</Text>
            <Text style={styles.detailValue}>
              {fees.length > 0 ? Array.from(new Set(fees.map(f => f.serviceArea))).join(', ') : 'Citywide'}
            </Text>
          </View>

          {fees.length > 0 && (
            <View style={{ marginLeft: 180, marginTop: 5, marginBottom: 10 }}>
              {Array.from(new Set(fees.map(f => f.serviceArea))).map((area, idx) => {
                const areaFees = fees.filter(f => f.serviceArea === area);
                const categories = Array.from(new Set(areaFees.map(f => f.category)));
                return (
                  <Text key={idx} style={{ fontSize: 9, color: '#4a5568', marginBottom: 2 }}>
                    • {area}: {categories.join(', ')}
                  </Text>
                );
              })}
            </View>
          )}

          <View style={styles.divider} />

          {project.projectType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project Type:</Text>
              <Text style={styles.detailValue}>
                {project.projectType}
                {project.useSubtype && ` - ${project.useSubtype}`}
              </Text>
            </View>
          )}

          {project.numUnits && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Number of Units:</Text>
              <Text style={styles.detailValue}>{project.numUnits} dwelling units</Text>
            </View>
          )}

          {project.squareFeet && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Square Footage:</Text>
              <Text style={styles.detailValue}>{project.squareFeet.toLocaleString()} sq ft</Text>
            </View>
          )}

          {project.projectValue && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project Value:</Text>
              <Text style={styles.detailValue}>${project.projectValue.toLocaleString()}</Text>
            </View>
          )}

          {project.meterSize && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Water Meter Size:</Text>
              <Text style={styles.detailValue}>{project.meterSize}</Text>
            </View>
          )}

          {project.acreage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lot Size:</Text>
              <Text style={styles.detailValue}>{project.acreage} acres</Text>
            </View>
          )}

          {!project.acreage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lot Size:</Text>
              <Text style={[styles.detailValue, { color: '#718096' }]}>[Not specified]</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Timeline</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Construction Start:</Text>
            <Text style={[styles.detailValue, startDate ? {} : { color: '#718096' }]}>
              {startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Not specified]'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expected Completion:</Text>
            <Text style={[styles.detailValue, completionDate ? {} : { color: '#718096' }]}>
              {completionDate ? new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Not specified]'}
            </Text>
          </View>
          {startDate && completionDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project Duration:</Text>
              <Text style={styles.detailValue}>
                {Math.ceil((new Date(completionDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months (estimated)
              </Text>
            </View>
          )}
        </View>

        <PageFooter pageNumber={3} />
      </Page>

      {/* PAGE 4: ONE-TIME DEVELOPMENT FEES */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>One-Time Development Fees</Text>

        {/* Project Specifications Summary */}
        <View style={[styles.summary, { marginBottom: 20 }]}>
          <Text style={[styles.bold, { fontSize: 12, marginBottom: 10 }]}>Project Specifications</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Jurisdiction:</Text>
              <Text style={styles.tableCell}>
                {project.jurisdictionName ? `${project.jurisdictionName}, ${project.stateCode}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Project Type:</Text>
              <Text style={styles.tableCell}>
                {project.projectType || 'N/A'}
                {project.useSubtype && ` - ${project.useSubtype}`}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Number of Units:</Text>
              <Text style={styles.tableCell}>
                {project.numUnits ? `${project.numUnits} units` : 'N/A'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Square Footage:</Text>
              <Text style={styles.tableCell}>
                {project.squareFeet ? `${project.squareFeet.toLocaleString()} sq ft` : 'N/A'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Project Value:</Text>
              <Text style={styles.tableCell}>
                {project.projectValue ? `$${project.projectValue.toLocaleString()}` : 'N/A'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Meter Size:</Text>
              <Text style={styles.tableCell}>
                {project.meterSize || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Fee Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Fee Name</Text>
            <Text style={styles.tableCell}>Service Area</Text>
            <Text style={styles.tableCell}>Category</Text>
            <Text style={styles.tableCellRight}>Amount</Text>
          </View>

          {oneTimeFees.map((fee, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontSize: 10 }]}>{fee.feeName}</Text>
              <Text style={[styles.tableCell, { fontSize: 9 }]}>{fee.serviceArea}</Text>
              <Text style={[styles.tableCell, { fontSize: 9 }]}>{fee.category}</Text>
              <Text style={[styles.tableCellRight, { fontSize: 10 }]}>
                ${formatCurrency(fee.calculatedAmount)}
              </Text>
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#f7fafc', borderTop: '2 solid #2c5282' }]}>
            <Text style={[styles.tableCell, { flex: 2 }, styles.bold]}>Subtotal</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCellRight, styles.bold]}>
              ${formatCurrency(breakdown.oneTimeFees)}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          * Impact fees are due at building permit issuance
        </Text>

        <PageFooter pageNumber={4} />
      </Page>

      {/* PAGE 5: MONTHLY OPERATING FEES */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Monthly Operating Fees</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Fee Name</Text>
            <Text style={styles.tableCell}>Service Area</Text>
            <Text style={styles.tableCellRight}>Monthly</Text>
            <Text style={styles.tableCellRight}>Annual</Text>
          </View>

          {monthlyFees.map((fee, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, fontSize: 10 }]}>{fee.feeName}</Text>
              <Text style={[styles.tableCell, { fontSize: 9 }]}>{fee.serviceArea}</Text>
              <Text style={[styles.tableCellRight, { fontSize: 10 }]}>
                ${formatCurrency(fee.calculatedAmount)}
              </Text>
              <Text style={[styles.tableCellRight, { fontSize: 10 }]}>
                ${formatCurrency(fee.calculatedAmount * 12)}
              </Text>
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#f7fafc', borderTop: '2 solid #2c5282' }]}>
            <Text style={[styles.tableCell, { flex: 2 }, styles.bold]}>Subtotal</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={[styles.tableCellRight, styles.bold]}>
              ${formatCurrency(breakdown.monthlyFees)}
            </Text>
            <Text style={[styles.tableCellRight, styles.bold]}>
              ${formatCurrency(breakdown.annualOperatingCosts)}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          * Water volume charges shown as annual average - actual charges vary by season
        </Text>
        <Text style={styles.note}>
          * Monthly operating costs begin at occupancy
        </Text>

        <PageFooter pageNumber={5} />
      </Page>

      {/* PAGE 6: COST SUMMARY & PROJECTIONS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Cost Summary & Projections</Text>

        <View style={styles.summary}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', marginBottom: 15 }]}>
            Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text>One-Time Development Fees:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.oneTimeFees)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Year 1 Operating Costs:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.annualOperatingCosts)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text style={styles.bold}>Total First Year Cost:</Text>
            <Text style={styles.bold}>${formatCurrency(breakdown.firstYearTotal)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long-Term Cost Projections</Text>
          <Text style={[styles.note, { paddingLeft: 0, marginBottom: 10, fontSize: 9 }]}>
            * Assumes no rate increases - actual costs will vary with rate adjustments
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Year</Text>
              <Text style={styles.tableCellRight}>Annual Operating</Text>
              <Text style={styles.tableCellRight}>Cumulative Total</Text>
            </View>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
              const annualOp = breakdown.annualOperatingCosts || 0;
              const cumulative = (breakdown.oneTimeFees || 0) + (annualOp * year);
              return (
                <View key={year} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{year}</Text>
                  <Text style={styles.tableCellRight}>${formatCurrency(annualOp)}</Text>
                  <Text style={styles.tableCellRight}>${formatCurrency(cumulative)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {project.numUnits && project.numUnits > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Per-Unit Costs</Text>
            <View style={styles.summaryRow}>
              <Text>Development Cost per Unit:</Text>
              <Text style={styles.bold}>
                ${formatCurrency((breakdown?.oneTimeFees || 0) / project.numUnits)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Monthly Operating Cost per Unit:</Text>
              <Text style={styles.bold}>
                ${formatCurrency((breakdown?.monthlyFees || 0) / project.numUnits)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>First Year Total per Unit:</Text>
              <Text style={styles.bold}>
                ${formatCurrency((breakdown?.firstYearTotal || 0) / project.numUnits)}
              </Text>
            </View>
          </View>
        )}

        <PageFooter pageNumber={6} />
      </Page>

      {/* PAGE 7: ASSUMPTIONS & DISCLAIMERS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Assumptions & Disclaimers</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <Text style={styles.text}>• Fees shown are current as of October 2025</Text>
          <Text style={styles.text}>• Impact fees are due at building permit issuance</Text>
          <Text style={styles.text}>• Monthly operating costs begin at occupancy</Text>
          <Text style={styles.text}>• Water volume charges vary seasonally (shown as annual average)</Text>
          <Text style={styles.text}>• Sewer fees may be reviewed annually based on winter water usage</Text>
          <Text style={styles.text}>• All fees subject to change - verify with jurisdiction before finalizing budgets</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exclusions</Text>
          <Text style={styles.text}>This report does NOT include:</Text>
          <Text style={styles.text}>• Building permit fees</Text>
          <Text style={styles.text}>• Plan review fees</Text>
          <Text style={styles.text}>• Inspection fees</Text>
          <Text style={styles.text}>• Trade permit fees (electrical, plumbing, mechanical)</Text>
          <Text style={styles.text}>• Utility connection labor costs</Text>
          <Text style={styles.text}>• Private development agreements or special assessments</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodology</Text>
          <Text style={styles.text}>
            Fee calculations are based on current published fee schedules{project.jurisdictionName && ` from ${project.jurisdictionName}`}.
            All calculations use the most recent available data and include applicable service area-specific fees.
          </Text>
          <Text style={styles.text}>
            Impact fees are calculated per the jurisdiction's impact fee ordinance and are specific to the
            selected service areas. Monthly utility fees include both fixed charges and variable consumption-based
            charges averaged over a 12-month period.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          This report is provided for informational purposes only and should not be considered legal or financial
          advice. All fees and charges are subject to change by the jurisdiction. Users should verify current fee
          amounts with the jurisdiction before making financial commitments. The creators of this report make no
          warranties regarding the accuracy or completeness of the information provided.
        </Text>

        <PageFooter pageNumber={7} />
      </Page>

      {/* PAGE 8: CONTACT INFORMATION */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>For Fee Verification Contact</Text>
        <View style={styles.divider} />

        {jurisdictionContactInfo && (jurisdictionContactInfo.contact_phone || jurisdictionContactInfo.contact_email || jurisdictionContactInfo.contact_department) ? (
          <View style={styles.contactBox}>
            {jurisdictionContactInfo.contact_department && (
              <Text style={[styles.contactText, styles.bold, { fontSize: 12, marginBottom: 8 }]}>
                {jurisdictionContactInfo.contact_department}
              </Text>
            )}

            {!jurisdictionContactInfo.contact_department && project.jurisdictionName && (
              <Text style={[styles.contactText, styles.bold, { fontSize: 12, marginBottom: 8 }]}>
                {project.jurisdictionName} Planning & Development
              </Text>
            )}

            {jurisdictionContactInfo.contact_address && (
              <Text style={styles.contactText}>{jurisdictionContactInfo.contact_address}</Text>
            )}

            {jurisdictionContactInfo.contact_phone && (
              <Text style={[styles.contactText, { marginTop: 8 }]}>
                Phone: {jurisdictionContactInfo.contact_phone}
              </Text>
            )}

            {jurisdictionContactInfo.contact_email && (
              <Text style={styles.contactText}>
                Email: {jurisdictionContactInfo.contact_email}
              </Text>
            )}

            {jurisdictionContactInfo.contact_website && (
              <Text style={styles.contactText}>
                Website: {jurisdictionContactInfo.contact_website}
              </Text>
            )}

            {jurisdictionContactInfo.contact_hours && (
              <Text style={[styles.contactText, { marginTop: 8 }]}>
                Hours: {jurisdictionContactInfo.contact_hours}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.contactBox}>
            <Text style={[styles.contactText, styles.bold, { fontSize: 12, marginBottom: 8 }]}>
              {project.jurisdictionName || 'Jurisdiction'} Planning & Development
            </Text>
            <Text style={styles.contactText}>
              Please contact your local jurisdiction's planning and development department
              to verify current fee schedules and confirm all calculations.
            </Text>
            <Text style={[styles.contactText, { marginTop: 8 }]}>
              Contact information can be found on the jurisdiction's official website.
            </Text>
          </View>
        )}

        <View style={[styles.section, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.text}>
            1. Review this feasibility report with your project stakeholders
          </Text>
          <Text style={styles.text}>
            2. Contact the jurisdiction to verify all fees and confirm applicability to your specific project
          </Text>
          <Text style={styles.text}>
            3. Budget for both one-time development fees and ongoing operating costs
          </Text>
          <Text style={styles.text}>
            4. Plan for impact fee payment at building permit issuance
          </Text>
          <Text style={styles.text}>
            5. Account for seasonal variations in water/sewer costs in your financial projections
          </Text>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={[styles.text, { fontSize: 10, color: '#718096', textAlign: 'center' }]}>
            This report was generated using the LEWIS Construction Portal
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#718096', textAlign: 'center', marginTop: 5 }]}>
            For questions about this report format or calculations, please contact your system administrator
          </Text>
        </View>

        <PageFooter pageNumber={8} />
      </Page>
    </Document>
  );
};
