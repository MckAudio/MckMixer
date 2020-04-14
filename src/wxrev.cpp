#include <wx/wx.h>

class RevApp : public wxApp
{
    public:
        virtual bool OnInit();
};

class RevFrame : public wxFrame
{
    public:
        RevFrame();
};

enum
{
    ID_Hello = 1
};

wxIMPLEMENT_APP(RevApp);

bool RevApp::OnInit()
{
    RevFrame *frame = new RevFrame();
    frame->Show(true);
    return true;
}

RevFrame::RevFrame() : wxFrame(NULL, wxID_ANY, "Hello Wx!")
{
    wxMenu *menuFile = new wxMenu;
    menuFile->Append(ID_Hello, "&Hello...\tCtrl-H", "Hello Help!");
    menuFile->AppendSeparator();
    menuFile->Append(wxID_EXIT);

    wxMenu *menuHelp = new wxMenu;
    menuHelp->Append(wxID_ABOUT);

    wxMenuBar *menuBar = new wxMenuBar;
    menuBar->Append(menuFile, "&File");
    menuBar->Append(menuHelp, "&Help");

    SetMenuBar(menuBar);

    CreateStatusBar();
    SetStatusText("Welcom to wxWidgets!");

    Bind(wxEVT_MENU, [=](wxCommandEvent&) { Close(true);}, wxID_EXIT);
    Bind(wxEVT_MENU, [=](wxCommandEvent&) { wxMessageBox("Hello World Example", "About Hello World", wxOK | wxICON_INFORMATION);}, wxID_ABOUT);
    Bind(wxEVT_MENU, [=](wxCommandEvent&) { wxLogMessage("Hello World from WXWidgets!");}, ID_Hello);

    wxBoxSizer *sizer = new wxBoxSizer(wxVERTICAL);
    sizer->Add(new wxSlider(this, wxID_ANY, 127, 0, 255));
    sizer->Add(new wxSlider(this, wxID_ANY, 0, -127, 127));
    sizer->SetSizeHints(this);
    SetSizer(sizer);
}