/**
 * Aelnir website: Google Forms setup.
 *
 * Creates the two forms aelnir.com sends to (the Reelock closed-test sign-up
 * and the Studio enquiry), their response spreadsheets, a rule that closes
 * sign-ups at 20 testers, an email to you for every sign-up and enquiry, and a
 * small web app that tells the site how many tester spots are taken.
 *
 * 1. Run `setup` once and approve the permissions Google asks for.
 * 2. Deploy → New deployment → Web app (execute as you, anyone can access).
 * 3. Run `printSettings` and copy the log into content/site.json.
 */

const TESTER = {
  title: 'Reelock closed test sign-ups',
  product: 'Reelock',
  cap: 20,
  creditsChoice: "Thank me in Reelock's contributor credits",
  consentChoice: 'Email me about the test'
};
const STUDIO = { title: 'Aelnir Studio enquiries' };
const NOTIFY = true; // Email the script owner on every sign-up and enquiry.

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('TESTER_FORM_ID')) {
    throw new Error('Already set up. Run printSettings to see the settings again.');
  }

  const tester = FormApp.create(TESTER.title)
    .setDescription('Sign-ups from aelnir.com for the ' + TESTER.product + ' closed test on Google Play. The first ' + TESTER.cap + ' testers get the tester perks.')
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('Thank you. You are in line for a ' + TESTER.product + ' tester spot.');
  tester.addTextItem().setTitle('Google account email').setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  tester.addTextItem().setTitle('WhatsApp number');
  tester.addCheckboxItem().setTitle('Contributor credits').setChoiceValues([TESTER.creditsChoice]);
  tester.addCheckboxItem().setTitle('Contact').setChoiceValues([TESTER.consentChoice]).setRequired(true);
  const testerSheet = SpreadsheetApp.create(TESTER.title + ' (responses)');
  tester.setDestination(FormApp.DestinationType.SPREADSHEET, testerSheet.getId());

  const studio = FormApp.create(STUDIO.title)
    .setDescription('Project enquiries from aelnir.com/studio.')
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('Thank you. We reply with our questions first.');
  studio.addTextItem().setTitle('Email').setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  studio.addTextItem().setTitle('WhatsApp number');
  studio.addParagraphTextItem().setTitle('What do you need built?').setRequired(true);
  const studioSheet = SpreadsheetApp.create(STUDIO.title + ' (responses)');
  studio.setDestination(FormApp.DestinationType.SPREADSHEET, studioSheet.getId());

  props.setProperties({ TESTER_FORM_ID: tester.getId(), STUDIO_FORM_ID: studio.getId() });
  ScriptApp.newTrigger('onTesterSubmit').forForm(tester).onFormSubmit().create();
  ScriptApp.newTrigger('onStudioSubmit').forForm(studio).onFormSubmit().create();

  Logger.log('Tester form: ' + tester.getEditUrl());
  Logger.log('Tester responses: ' + testerSheet.getUrl());
  Logger.log('Studio form: ' + studio.getEditUrl());
  Logger.log('Studio responses: ' + studioSheet.getUrl());
  printSettings();
}

/** Logs the JSON for content/site.json → "forms", plus the counter URL if deployed. */
function printSettings() {
  const tester = formById('TESTER_FORM_ID');
  const studio = formById('STUDIO_FORM_ID');
  const t = itemsByTitle(tester);
  const s = itemsByTitle(studio);
  const settings = {
    tester: {
      action: responseUrl(tester),
      fields: {
        email: entryOf(tester, t['Google account email'].asTextItem().createResponse('you@example.com')),
        whatsapp: entryOf(tester, t['WhatsApp number'].asTextItem().createResponse('0')),
        credits: { entry: entryOf(tester, t['Contributor credits'].asCheckboxItem().createResponse([TESTER.creditsChoice])), value: TESTER.creditsChoice },
        consent: { entry: entryOf(tester, t['Contact'].asCheckboxItem().createResponse([TESTER.consentChoice])), value: TESTER.consentChoice }
      }
    },
    studio: {
      action: responseUrl(studio),
      fields: {
        email: entryOf(studio, s['Email'].asTextItem().createResponse('you@example.com')),
        whatsapp: entryOf(studio, s['WhatsApp number'].asTextItem().createResponse('0')),
        message: entryOf(studio, s['What do you need built?'].asParagraphTextItem().createResponse('x'))
      }
    }
  };
  Logger.log(JSON.stringify(settings, null, 2));
  const url = ScriptApp.getService().getUrl();
  Logger.log(url ? 'Spots counter (testing.spotsCsv): ' + url : 'Spots counter: deploy this project as a web app, then run printSettings again.');
}

/** The web app: tells aelnir.com how many tester spots are taken. Reveals nothing else. */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ taken: takenSpots() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function onTesterSubmit(e) {
  const taken = takenSpots();
  if (taken >= TESTER.cap) {
    e.source.setAcceptingResponses(false)
      .setCustomClosedFormMessage('All ' + TESTER.cap + ' ' + TESTER.product + ' tester spots are taken. Thank you for your interest.');
  }
  if (NOTIFY) notify('New ' + TESTER.product + ' tester sign-up (' + Math.min(taken, TESTER.cap) + ' of ' + TESTER.cap + ')', e.response, 'Google account email');
}

function onStudioSubmit(e) {
  if (NOTIFY) notify('New Aelnir Studio enquiry', e.response, 'Email');
}

/** Unique tester emails so far: a repeated sign-up does not use a second spot. */
function takenSpots() {
  const form = formById('TESTER_FORM_ID');
  const email = itemsByTitle(form)['Google account email'];
  const seen = {};
  form.getResponses().forEach(function (response) {
    const answer = response.getResponseForItem(email);
    if (answer) seen[String(answer.getResponse()).trim().toLowerCase()] = true;
  });
  return Object.keys(seen).length;
}

function notify(subject, response, replyToTitle) {
  let replyTo = '';
  const lines = response.getItemResponses().map(function (answer) {
    const title = answer.getItem().getTitle();
    const value = [].concat(answer.getResponse()).join(', ');
    if (title === replyToTitle) replyTo = value;
    return title + ': ' + value;
  });
  const message = { to: Session.getEffectiveUser().getEmail(), subject: subject, body: lines.join('\n') + '\n\nSent from aelnir.com' };
  if (replyTo) message.replyTo = replyTo;
  MailApp.sendEmail(message);
}

function formById(key) {
  const id = PropertiesService.getScriptProperties().getProperty(key);
  if (!id) throw new Error('Run setup first.');
  return FormApp.openById(id);
}

function itemsByTitle(form) {
  const map = {};
  form.getItems().forEach(function (item) { map[item.getTitle()] = item; });
  return map;
}

function responseUrl(form) {
  return form.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse');
}

/** The entry.<number> field name Google uses for one question, read from a pre-filled link. */
function entryOf(form, itemResponse) {
  const match = form.createResponse().withItemResponse(itemResponse).toPrefilledUrl().match(/[?&](entry\.\d+)=/);
  return match ? match[1] : '';
}
