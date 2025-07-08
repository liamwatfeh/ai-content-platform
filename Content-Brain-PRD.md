# Product Requirements Document (PRD)
## AI-Powered Content Generation Platform

### Product Overview

The AI Content Generation Platform is a tool that transforms white papers and research documents into comprehensive marketing content packages. The system uses AI agents to analyze uploaded documents, generate targeted content themes, and produce ready-to-publish articles, LinkedIn posts, and social media content with appropriate calls-to-action.

### Target Users
- Marketing teams in financial services and wealth management
- Content creators who regularly work with white papers and research documents  
- Partners and affiliates who need localized content generation

### Core Value Proposition
Transform a single white paper into a month's worth of targeted marketing content (1 article, 4 LinkedIn posts, 8 social posts) with minimal human intervention and maximum relevance to target personas.

---

# MVP 

The api keys should be saved locally to .env file and their should be NO user login. Use supabase for backend

## User Stories & Use Cases

### Primary User Story
"As a marketing manager, I want to upload our quarterly wealth report and generate a complete content package targeting high-net-worth individuals in the Philippines, so I can execute our monthly content strategy efficiently."

### Secondary Use Cases
- Partners generating localized content from company white papers
- Content teams creating themed content campaigns
- Marketing agencies producing client content at scale

---

## Functional Requirements

### Phase 1: Brief Creation
**Inputs Required:**
- White paper upload (mandatory)
- Target persona (optional - can be extracted by AI)
- Marketing goals (optional - can be extracted by AI)
- Output quantity preferences (default: 1 article, 4 posts, 8 social)
- CTA configuration (download white paper URL or contact information)

**System Processing:**
- Vectorize uploaded white paper
- Extract or generate persona and marketing goals if not provided
- Create comprehensive brief combining all inputs

### Phase 2: Theme Selection (Human-in-the-Loop)
**System Processing:**
- Analyze brief and vectorized white paper
- Generate 3 potential content themes/angles
- Present themes with rationale for why each would appeal to target persona

**User Action Required:**
- Select one theme from the three options (mandatory approval step)

### Phase 3: Content Production
**System Processing:**
- Perform deep research using 10-20 targeted vector searches
- Generate detailed research document on selected theme
- Draft content according to specifications:
  - 1 long-form article
  - 4 LinkedIn posts
  - 8 short social media posts
- Apply copy editing with default style guide (The Economist)
- Integrate specified CTAs into all content

**Output Delivery:**
- Complete content package ready for publishing
- All content includes appropriate CTAs
- Content formatted for respective platforms


---

## User Flow

### Initial Setup Flow
1. User uploads white paper
2. System processes and vectorizes document
3. User provides or confirms:
   - Target persona details
   - Marketing campaign goals
   - Output quantity preferences
   - CTA configuration
4. System generates comprehensive brief

### Content Generation Flow
1. System analyzes brief and generates 3 content themes
2. User reviews and selects preferred theme (mandatory checkpoint)
3. System performs deep research on selected theme
4. System generates content package:
   - 1 article
   - 4 LinkedIn posts  
   - 8 social media posts
5. System applies copy editing and CTA integration
6. User receives complete content package

### Recurring Usage Flow
- Monthly recurring pattern
- Users return to generate new themes from same or different white papers
- System maintains context and learning from previous interactions

---

## Success Metrics & Evaluation Criteria

### Quality Benchmarks
- 80-90% of generated content should be ready-to-publish without major edits
- Content should be coherent and maintain thematic consistency
- CTAs should be appropriately integrated and contextual

### User Testing Criteria
- New users should be able to complete the full flow without assistance
- Generated content should receive positive quality ratings from users
- Content should effectively target specified personas

### Technical Performance
- White paper processing should complete within acceptable timeframes
- Vector searches should return relevant and comprehensive results
- System should handle various document formats and sizes

### Test Cases
- Primary: The Wealth Report → coherent content package output
- Secondary: "Prepared Minds" white paper → quality content generation
- User acceptance: First-time user completes flow and rates output positively

---

## Technical Specifications

### Input Requirements
- Document formats: PDF, DOCX (white papers)
- Maximum document size: TBD based on processing capabilities
- Required metadata: Title, publication date, target audience

### Output Specifications
**Article (1x):**
- Length: 800-1500 words
- Format: Long-form content suitable for newsletters or blog posts
- Includes: Introduction, body sections, conclusion, CTA

**LinkedIn Posts (4x):**
- Length: 150-300 words each
- Format: Professional social media posts
- Includes: Engaging hook, key insights, CTA

**Social Media Posts (8x):**
- Length: 30-50 words each
- Format: Short-form social content
- Includes: Key message, CTA

### Style Guide Integration
- Default: The Economist Style Guide
- Configurable: Users can upload custom style guides
- Fallback: Standard business writing conventions

### CTA Options
- Download white paper (requires URL)
- Contact information (email or generic contact)
- Custom CTA text and links

---

## Future Considerations

### Version 2 Features
- Multi-theme selection and combination
- Custom output ratios and quantities
- Advanced style guide customization
- Integration with publishing platforms
- Analytics on content performance

### Scalability Requirements
- Multi-tenant architecture for partner/agency use
- API access for integration with existing workflows
- Bulk processing capabilities
- Advanced user management and permissions